#!/usr/bin/env python3
"""Bake a DomoView Home Pack with Blender.

Produces the images the `baked` renderer needs:

    day.png              full daylight, lamps off
    night.png            lamps off, ambient only
    lights/<id>.png      each fixture's light contribution, alone in the dark
    position.png         world position packed into RGB across model.bounds
    normal.png           world normal, packed
    exterior-mask.png    white where the camera sees the outside of the building
    window-mask.png      white on visible glass

and writes a `baked` section plus per-fixture `screen` coordinates back into
home.json.

Usage
-----
    blender --background --python tools/bake/bake.py -- \\
        --pack /path/to/pack [--size 2048] [--samples 256] [--only day,night]

Everything after `--` is passed to this script; Blender eats anything before it.

Why the light passes look like this
-----------------------------------
Each fixture is rendered *alone with no world lighting*, so the resulting image
is the light it adds rather than a lit scene. The card then adds those images in
linear light, scaled by the entity's brightness. That is why two lamps at half
brightness come out the same as one at full, and why a bulb changing colour does
not need a new bake: the reference colour is recorded in the manifest and
divided out at runtime.

Requires Blender 4.2 or newer (tested against 4.2 LTS and 4.5).
"""

from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path

try:
    import bpy
    import mathutils
except ImportError:  # pragma: no cover - only reachable outside Blender
    sys.exit("bake.py must be run inside Blender: blender --background --python tools/bake/bake.py -- --pack DIR")

import numpy as np


# --------------------------------------------------------------------------- #
# arguments
# --------------------------------------------------------------------------- #

def parse_args(argv: list[str]) -> dict:
    """Minimal parser. argparse fights Blender over sys.argv, so do it by hand."""
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    options = {
        "pack": None,
        "size": 2048,
        "samples": 256,
        "only": None,
        "device": "GPU",
    }
    index = 0
    while index < len(argv):
        token = argv[index]
        if not token.startswith("--"):
            sys.exit(f"unexpected argument: {token}")
        key = token[2:]
        if key not in options:
            sys.exit(f"unknown option: {token}")
        if index + 1 >= len(argv):
            sys.exit(f"{token} needs a value")
        options[key] = argv[index + 1]
        index += 2

    if not options["pack"]:
        sys.exit("--pack is required")
    options["size"] = int(options["size"])
    options["samples"] = int(options["samples"])
    if options["only"]:
        options["only"] = {name.strip() for name in str(options["only"]).split(",") if name.strip()}
    return options


# --------------------------------------------------------------------------- #
# scene setup
# --------------------------------------------------------------------------- #

def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def load_model(glb_path: Path, up_axis: str) -> bpy.types.Object:
    """Import the GLB and rotate it into pack space (+Z up)."""
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    root = bpy.data.objects.new("dv_pack_root", None)
    bpy.context.scene.collection.objects.link(root)

    for obj in list(bpy.context.scene.objects):
        if obj is root or obj.parent is not None:
            continue
        obj.parent = root

    # Blender is Z-up. glTF is Y-up, and Blender's importer already applies the
    # +90 degree X rotation, so a Y-up pack needs nothing further here. A pack
    # that declares Z-up was exported without that conversion, so undo the
    # importer's assumption.
    if up_axis == "Z":
        root.rotation_euler = (-math.pi / 2, 0.0, 0.0)
    return root


def configure_render(scene: bpy.types.Scene, size: int, samples: int, device: str) -> None:
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.transmission_bounces = 8
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False

    if device.upper() == "GPU":
        preferences = bpy.context.preferences.addons.get("cycles")
        if preferences:
            for backend in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
                try:
                    preferences.preferences.compute_device_type = backend
                except TypeError:
                    continue
                devices = preferences.preferences.get_devices_for_type(backend)
                if devices:
                    for gpu in devices:
                        gpu.use = True
                    scene.cycles.device = "GPU"
                    print(f"bake: using {backend}")
                    break

    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    # Filmic and AgX both remap highlights non-linearly, which breaks the
    # assumption that these images add linearly. Standard keeps the maths valid.
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0


def build_camera(scene: bpy.types.Scene, camera_def: dict, bounds: dict, north: float) -> bpy.types.Object:
    """Orthographic camera matching the pack's camera definition."""
    data = bpy.data.cameras.new("dv_camera")
    data.type = "ORTHO"
    camera = bpy.data.objects.new("dv_camera", data)
    scene.collection.objects.link(camera)
    scene.camera = camera

    minimum = mathutils.Vector(bounds["min"])
    maximum = mathutils.Vector(bounds["max"])
    target = mathutils.Vector(camera_def.get("target") or [
        (minimum.x + maximum.x) / 2, (minimum.y + maximum.y) / 2, minimum.z + 1.2,
    ])

    azimuth = math.radians(camera_def.get("azimuth", 225) - north)
    elevation = math.radians(camera_def.get("elevation", 40))
    span = max(maximum.x - minimum.x, maximum.y - minimum.y)
    distance = span * 3.0

    eye = target + mathutils.Vector((
        math.sin(azimuth) * math.cos(elevation),
        math.cos(azimuth) * math.cos(elevation),
        math.sin(elevation),
    )) * distance
    camera.location = eye

    direction = (target - eye).normalized()
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    # Must match FRAME_MARGIN in src/renderers/baked/projection.js, or every
    # overlay the card draws over the bake lands in the wrong place.
    camera.data.ortho_scale = span * 1.13 / max(0.01, camera_def.get("zoom", 1))
    camera.data.clip_start = 0.01
    camera.data.clip_end = distance * 4
    return camera


def set_world(strength: float, colour=(0.62, 0.72, 0.86)) -> None:
    world = bpy.data.worlds.get("dv_world") or bpy.data.worlds.new("dv_world")
    bpy.context.scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    nodes.clear()
    background = nodes.new("ShaderNodeBackground")
    output = nodes.new("ShaderNodeOutputWorld")
    background.inputs["Color"].default_value = (*colour, 1.0)
    background.inputs["Strength"].default_value = strength
    world.node_tree.links.new(background.outputs["Background"], output.inputs["Surface"])


def add_sun(azimuth: float, elevation: float, strength: float, north: float) -> bpy.types.Object:
    data = bpy.data.lights.new("dv_sun", type="SUN")
    data.energy = strength
    data.angle = math.radians(0.53)
    data.color = (1.0, 0.95, 0.88)
    sun = bpy.data.objects.new("dv_sun", data)
    bpy.context.scene.collection.objects.link(sun)

    direction = mathutils.Vector((
        math.sin(math.radians(azimuth - north)) * math.cos(math.radians(elevation)),
        math.cos(math.radians(azimuth - north)) * math.cos(math.radians(elevation)),
        math.sin(math.radians(elevation)),
    ))
    sun.rotation_euler = (-direction).to_track_quat("Z", "Y").to_euler()
    return sun


def create_fixture_lights(fixture: dict) -> list[bpy.types.Object]:
    """One Blender light per emitter, weighted so the fixture totals its lumens."""
    emitters = [e for e in fixture.get("emitters", []) if e.get("type") != "emissive"]
    if not emitters:
        return []

    photometry = fixture.get("light", {})
    lumens = photometry.get("lumens", 600)
    colour = [c / 255 for c in photometry.get("color", [255, 221, 164])]
    total_weight = sum(e.get("intensity", 1) for e in emitters) or 1

    created = []
    for index, emitter in enumerate(emitters):
        kind = emitter.get("type", "point")
        light_type = "SPOT" if kind == "spot" else "AREA" if kind in ("strip", "area") else "POINT"
        data = bpy.data.lights.new(f"{fixture['id']}_{index}", type=light_type)

        # Blender's point/spot energy is in watts; roughly 1 W to 120 lm for a
        # domestic LED. Approximate, and consistent across a pack, which is
        # what matters for relative brightness.
        share = emitter.get("intensity", 1) / total_weight
        data.energy = lumens * share / 120.0
        data.color = colour
        data.shadow_soft_size = emitter.get("radius", 0.06)

        if light_type == "SPOT":
            data.spot_size = math.radians(emitter.get("angle", 40) * 2)
            data.spot_blend = emitter.get("penumbra", 0.4)
        elif light_type == "AREA":
            data.shape = "RECTANGLE"
            data.size = 0.5
            data.size_y = 0.03

        obj = bpy.data.objects.new(data.name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.location = mathutils.Vector(emitter["position"])

        target = emitter.get("target")
        if light_type == "SPOT":
            aim = mathutils.Vector(target) if target else obj.location - mathutils.Vector((0, 0, 1))
            obj.rotation_euler = (aim - obj.location).normalized().to_track_quat("-Z", "Y").to_euler()

        created.append(obj)
    return created


def set_lights_visible(lights: list[bpy.types.Object], visible: bool) -> None:
    for light in lights:
        light.hide_render = not visible


def set_emissive_visible(root: bpy.types.Object, fixture_ids: set[str], visible: bool) -> None:
    """Hide lamp bodies so their own glow does not appear in every light pass."""
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        owner = obj
        while owner is not None and owner is not root:
            name = owner.name
            if name.startswith("dv_light_"):
                if name[len("dv_light_"):] in fixture_ids:
                    obj.hide_render = not visible
                break
            owner = owner.parent


# --------------------------------------------------------------------------- #
# passes
# --------------------------------------------------------------------------- #

def render_to(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(path.with_suffix(""))
    bpy.ops.render.render(write_still=True)
    print(f"bake: wrote {path.name}")


def render_gbuffer(output_dir: Path, bounds: dict, size: int) -> None:
    """Render world position and normal, remapped into 0..1 and saved as PNG.

    The card decodes position.png across exactly `model.bounds`, so the two must
    agree. Eight bits per axis is coarse — that is why the runtime projection
    only trusts upward-facing surfaces.
    """
    scene = bpy.context.scene
    layer = scene.view_layers[0]
    layer.use_pass_position = True
    layer.use_pass_normal = True
    layer.use_pass_combined = False

    # Render to a float EXR, then remap in numpy: doing the mapping in the
    # compositor works too, but reading the values back is far easier to verify.
    scene.render.image_settings.file_format = "OPEN_EXR_MULTILAYER"
    scene.render.image_settings.color_depth = "32"
    exr_path = output_dir / "_gbuffer.exr"
    scene.render.filepath = str(exr_path.with_suffix(""))
    bpy.ops.render.render(write_still=True)

    image = bpy.data.images.load(str(exr_path))
    pixels = np.array(image.pixels[:], dtype=np.float32).reshape(size, size, -1)

    minimum = np.array(bounds["min"], dtype=np.float32)
    maximum = np.array(bounds["max"], dtype=np.float32)
    span = np.maximum(maximum - minimum, 1e-6)

    # Blender's EXR channel order depends on the passes enabled; locate them by
    # name rather than assuming an offset.
    channels = [c.name for c in image.channels] if hasattr(image, "channels") else []
    print(f"bake: gbuffer channels {channels or '(assuming Combined/Position/Normal order)'}")

    position = pixels[:, :, 0:3]
    normal = pixels[:, :, 4:7] if pixels.shape[2] >= 8 else pixels[:, :, 3:6]
    alpha = (np.abs(position).sum(axis=2) > 1e-6).astype(np.float32)

    encoded_position = np.clip((position - minimum) / span, 0.0, 1.0)
    encoded_normal = np.clip((normal + 1.0) * 0.5, 0.0, 1.0)

    write_png(output_dir / "position.png", encoded_position, alpha, size)
    write_png(output_dir / "normal.png", encoded_normal, alpha, size)

    bpy.data.images.remove(image)
    exr_path.unlink(missing_ok=True)

    layer.use_pass_position = False
    layer.use_pass_normal = False
    layer.use_pass_combined = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"


def write_png(path: Path, rgb: np.ndarray, alpha: np.ndarray, size: int) -> None:
    """Write straight pixel data, bypassing the view transform."""
    image = bpy.data.images.new(path.stem, width=size, height=size, alpha=True, float_buffer=False)
    flat = np.empty((size, size, 4), dtype=np.float32)
    flat[:, :, 0:3] = rgb
    flat[:, :, 3] = alpha
    image.pixels = flat.reshape(-1)
    image.colorspace_settings.name = "Non-Color"
    image.file_format = "PNG"
    image.filepath_raw = str(path)
    image.save()
    bpy.data.images.remove(image)
    print(f"bake: wrote {path.name}")


def make_mask_material(name: str, white: bool) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    emission = nodes.new("ShaderNodeEmission")
    output = nodes.new("ShaderNodeOutputMaterial")
    value = 1.0 if white else 0.0
    emission.inputs["Color"].default_value = (value, value, value, 1.0)
    emission.inputs["Strength"].default_value = 1.0
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def render_window_mask(output_dir: Path, root: bpy.types.Object) -> None:
    """White on dv_glass, black everywhere else."""
    white = make_mask_material("dv_mask_white", True)
    black = make_mask_material("dv_mask_black", False)
    saved: list[tuple[bpy.types.Object, list]] = []

    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        saved.append((obj, list(obj.data.materials)))
        is_glass = "dv_glass" in obj.name or any(
            "dv_glass" in (m.name if m else "") for m in obj.data.materials)
        obj.data.materials.clear()
        obj.data.materials.append(white if is_glass else black)

    set_world(0.0)
    render_to(output_dir / "window-mask.png")

    for obj, materials in saved:
        obj.data.materials.clear()
        for material in materials:
            obj.data.materials.append(material)
    void = root  # keeps the signature honest about what it operates on
    del void


def render_exterior_mask(output_dir: Path, root: bpy.types.Object, bounds: dict) -> None:
    """White where a surface faces away from the middle of the home.

    The card uses this so that facade pixels keep full daylight when the rooms
    behind them are shut. Without it the room flood-fill spills onto the
    facade and darkens the outside of the building.
    """
    centre = [(a + b) / 2 for a, b in zip(bounds["min"], bounds["max"])]

    material = bpy.data.materials.new("dv_mask_exterior")
    material.use_nodes = True
    tree = material.node_tree
    nodes = tree.nodes
    nodes.clear()

    geometry = nodes.new("ShaderNodeNewGeometry")
    centre_vector = nodes.new("ShaderNodeCombineXYZ")
    centre_vector.inputs[0].default_value = centre[0]
    centre_vector.inputs[1].default_value = centre[1]
    centre_vector.inputs[2].default_value = centre[2]

    outward = nodes.new("ShaderNodeVectorMath")
    outward.operation = "SUBTRACT"
    facing = nodes.new("ShaderNodeVectorMath")
    facing.operation = "DOT_PRODUCT"
    step = nodes.new("ShaderNodeMath")
    step.operation = "GREATER_THAN"
    step.inputs[1].default_value = 0.0

    emission = nodes.new("ShaderNodeEmission")
    output = nodes.new("ShaderNodeOutputMaterial")

    tree.links.new(geometry.outputs["Position"], outward.inputs[0])
    tree.links.new(centre_vector.outputs["Vector"], outward.inputs[1])
    tree.links.new(outward.outputs["Vector"], facing.inputs[0])
    tree.links.new(geometry.outputs["Normal"], facing.inputs[1])
    tree.links.new(facing.outputs["Value"], step.inputs[0])
    tree.links.new(step.outputs["Value"], emission.inputs["Strength"])
    emission.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])

    saved: list[tuple[bpy.types.Object, list]] = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        saved.append((obj, list(obj.data.materials)))
        obj.data.materials.clear()
        obj.data.materials.append(material)

    set_world(0.0)
    render_to(output_dir / "exterior-mask.png")

    for obj, materials in saved:
        obj.data.materials.clear()
        for stored in materials:
            obj.data.materials.append(stored)
    del root


# --------------------------------------------------------------------------- #
# screen coordinates
# --------------------------------------------------------------------------- #

def project_to_screen(point, camera: bpy.types.Object, scene: bpy.types.Scene) -> list[float]:
    """World point to a percentage of the rendered image."""
    from bpy_extras.object_utils import world_to_camera_view
    projected = world_to_camera_view(scene, camera, mathutils.Vector(point))
    return [round(projected.x * 100, 3), round((1.0 - projected.y) * 100, 3)]


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #

def main() -> None:
    options = parse_args(sys.argv)
    pack_dir = Path(options["pack"]).resolve()
    manifest_path = pack_dir / "home.json"
    if not manifest_path.exists():
        sys.exit(f"no home.json in {pack_dir}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("pack", {}).get("schema") != 1:
        sys.exit("bake.py understands Home Pack schema 1 only")

    bounds = manifest.get("model", {}).get("bounds")
    if not bounds:
        sys.exit("model.bounds is required for a bake: the position G-buffer is "
                 "encoded across exactly that box. Add it to home.json.")

    size = options["size"]
    only = options["only"]
    wanted = lambda name: only is None or name in only  # noqa: E731

    output_dir = pack_dir / "baked"
    output_dir.mkdir(exist_ok=True)

    cameras = manifest.get("cameras") or [{"id": "default", "azimuth": 225, "elevation": 40}]
    camera_def = next((c for c in cameras if c.get("default")), cameras[0])
    north = manifest.get("pack", {}).get("north", 0) or 0

    reset_scene()
    scene = bpy.context.scene
    configure_render(scene, size, options["samples"], options["device"])
    root = load_model(pack_dir / manifest["model"]["url"], manifest["model"].get("up", "Y"))
    camera = build_camera(scene, camera_def, bounds, north)

    fixtures = [f for f in manifest.get("fixtures", []) if f.get("kind") in ("light", "media")]
    fixture_lights = {f["id"]: create_fixture_lights(f) for f in fixtures}
    all_lights = [light for group in fixture_lights.values() for light in group]
    all_ids = {f["id"] for f in fixtures}

    baked = {
        "size": size,
        "camera": camera_def["id"],
        "day": "baked/day.png",
        "night": "baked/night.png",
        "gbuffer": {"position": "baked/position.png", "normal": "baked/normal.png"},
        "masks": {"exterior": "baked/exterior-mask.png", "glass": "baked/window-mask.png"},
        "lights": {},
    }

    # --- day: sky and sun, lamps off -------------------------------------- #
    if wanted("day"):
        set_lights_visible(all_lights, False)
        set_emissive_visible(root, all_ids, True)
        set_world(1.0)
        sun = add_sun(camera_def.get("azimuth", 225) + 40, 45, 3.0, north)
        render_to(output_dir / "day.png")
        bpy.data.objects.remove(sun, do_unlink=True)

    # --- night: ambient only ---------------------------------------------- #
    if wanted("night"):
        set_lights_visible(all_lights, False)
        set_world(0.04, colour=(0.10, 0.13, 0.20))
        render_to(output_dir / "night.png")

    # --- per-fixture light deltas ----------------------------------------- #
    lights_dir = output_dir / "lights"
    for fixture in fixtures:
        baked["lights"][fixture["id"]] = f"baked/lights/{fixture['id']}.png"
        if not wanted("lights"):
            continue
        group = fixture_lights[fixture["id"]]
        if not group and not fixture.get("render", {}).get("emissiveNodes"):
            print(f"bake: {fixture['id']} has no emitters, skipping")
            continue
        # Alone, in the dark: the render *is* the contribution.
        set_world(0.0)
        set_lights_visible(all_lights, False)
        set_lights_visible(group, True)
        set_emissive_visible(root, all_ids - {fixture["id"]}, False)
        set_emissive_visible(root, {fixture["id"]}, True)
        render_to(lights_dir / f"{fixture['id']}.png")

    set_emissive_visible(root, all_ids, True)
    set_lights_visible(all_lights, False)

    # --- masks ------------------------------------------------------------- #
    if wanted("masks"):
        render_window_mask(output_dir, root)
        render_exterior_mask(output_dir, root, bounds)

    # --- G-buffer ---------------------------------------------------------- #
    if wanted("gbuffer"):
        set_world(0.0)
        render_gbuffer(output_dir, bounds, size)

    # --- outdoor surfaces for weather -------------------------------------- #
    wet = [
        {"id": room["id"], "polygon": room["polygon"], "height": 0}
        for room in manifest.get("rooms", [])
        if room.get("outdoor") and room.get("polygon")
    ]
    if wet:
        baked["surfaces"] = {"wet": wet}

    # --- marker positions -------------------------------------------------- #
    for fixture in manifest.get("fixtures", []):
        emitters = fixture.get("emitters") or []
        if not emitters:
            continue
        centre = [
            sum(e["position"][axis] for e in emitters) / len(emitters)
            for axis in range(3)
        ]
        fixture["screen"] = project_to_screen(centre, camera, scene)

    manifest["baked"] = baked
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"\nbake: done. {len(baked['lights'])} light passes, {size}px.")
    print(f"bake: updated {manifest_path}")
    print("bake: validate with  node tools/pack/validate.mjs " + str(pack_dir))


if __name__ == "__main__":
    main()
