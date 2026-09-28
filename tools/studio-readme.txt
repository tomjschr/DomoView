DomoView Studio
===============

Turn a floor plan image and a few room photos into a Home Pack for the
DomoView card in Home Assistant.

Everything runs on your own machine. Nothing is uploaded anywhere.


Start it
--------

You need Node.js 20 or newer (https://nodejs.org). Then, in this folder:

    node serve.mjs

and open http://127.0.0.1:8099/ in your browser.

If that port is taken, pass another one:  node serve.mjs 8100

Opening index.html by double-clicking does NOT work. The Studio is an ES
module, and browsers refuse to load modules straight off the filesystem.
That is a browser security rule, not a DomoView limitation.


No Node.js, or you would rather not install it?
-----------------------------------------------

Two alternatives, both identical in function:

  * The hosted copy:  https://tomjschr.github.io/interactive_floormap/studio/
  * Your own Home Assistant, once DomoView is installed through HACS:
      http://<your-ha>:8123/local/domoview/studio/index.html


What you get out
----------------

The Export step downloads a zip containing three things:

    my-home/                  the pack - upload this folder
      home.json               rooms, walls, windows, fixtures, cameras
      model.glb               the geometry
      README.txt
    my-home-card.yaml         paste into a dashboard card
    my-home.domoview.json     your editable source - keep this

  1. Upload the FOLDER so that this path exists in Home Assistant:
       /config/www/domoview/homes/my-home/home.json
     File Editor, Samba or the VS Code add-on all work.

  2. Open my-home-card.yaml. It lists every fixture, blind, window contact
     and room the pack defines. Replace each '' with one of your entities.

  3. Paste it into: Edit dashboard -> + Add card -> Manual

The card's visual editor offers the same keys with entity pickers, if you
would rather click than type.


Keep two files out of /config/www
---------------------------------

The card YAML and the project file are deliberately NOT inside the pack
folder. Everything under /config/www is served by Home Assistant WITHOUT
authentication. Once filled in, the YAML lists your entity ids, and the
project file embeds your floor plan image and any photos you attached.


Keep the project file
---------------------

my-home.domoview.json is the source; the pack is the output. Reopen it with
"Open..." to fix a sill height or add a lamp, then export again. Without it
you would be tracing the plan from scratch.


Documentation and issues
------------------------

https://github.com/tomjschr/interactive_floormap

The authoring guide is worth ten minutes before you start - especially the
part about which four measurements actually matter:
https://github.com/tomjschr/interactive_floormap/blob/main/docs/authoring-from-photos.md
