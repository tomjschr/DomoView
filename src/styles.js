/* Card styles.
 *
 * Home Assistant theme variables are used wherever one exists, with a literal
 * fallback, so the card inherits a user's theme instead of imposing a palette.
 * The scene itself stays transparent: a Home Pack is rendered with an alpha
 * background so it sits on the dashboard rather than in a box.
 */

export function cardStyles() {
  return `
  :host {
    display: block;
    color: var(--primary-text-color, #e9f1ef);
    font-family: var(--paper-font-body1_-_font-family, Inter, system-ui, -apple-system, sans-serif);
    --dv-panel: var(--card-background-color, #1a2a32);
    --dv-accent: var(--state-light-active-color, #f4c676);
    --dv-outline: var(--divider-color, #ffffff40);
  }
  * { box-sizing: border-box; }

  .card { background: transparent; border: 0; box-shadow: none; }

  .scene {
    position: relative;
    aspect-ratio: var(--domoview-aspect, 1 / 1);
    width: 100%;
    isolation: isolate;
    overflow: hidden;
    background: transparent;
    contain: layout paint;
  }

  .stage { position: absolute; inset: 0; }
  .stage > * { position: absolute; inset: 0; width: 100%; height: 100%; }

  .domoview-canvas { display: block; touch-action: none; }
  .domoview-baked { position: absolute; inset: 0; }
  .domoview-baked > canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .domoview-composite { z-index: 1; }
  .domoview-weather { z-index: 2; pointer-events: none; }
  .domoview-covers { z-index: 3; pointer-events: none; }

  .overlays { position: absolute; inset: 0; pointer-events: none; z-index: 4; }
  .climate, .windows, .markers { position: absolute; inset: 0; }
  .climate { z-index: 5; }
  .windows { z-index: 6; }
  .markers { z-index: 7; }

  .chip {
    position: absolute;
    transform: translate(-50%, -50%);
    padding: 2px 3px;
    text-align: center;
    white-space: nowrap;
    color: #f9fbfa;
    text-shadow: 0 1px 3px #15252ce0, 0 0 7px #15252caa;
  }
  .chip-values { display: grid; gap: 1px; font-size: 10px; font-weight: 600; line-height: 1.05; }
  .chip-values span { display: flex; align-items: center; justify-content: center; gap: 2px; }
  .chip-values svg { width: 10px; height: 10px; }
  .chip-values svg.stroked { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

  .window-open {
    position: absolute;
    transform: translate(-50%, -100%);
    display: grid;
    place-items: center;
    width: 23px; height: 23px;
    border-radius: 50%;
    border: 1px solid #b7e4ce;
    background: #234d49e8;
    color: #f3fff9;
    box-shadow: 0 2px 7px #0d2635a8;
  }
  .window-open svg { width: 17px; height: 17px; fill: currentColor; }

  .marker {
    position: absolute;
    width: 18px; height: 18px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid #e8f6ee;
    background: #0e665bc9;
    box-shadow: 0 0 0 4px #0e665b50, 0 2px 10px #0008;
    font-size: 0;
    color: transparent;
    padding: 0;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity .2s, transform .2s;
  }
  .markers.inspecting .marker { opacity: .95; pointer-events: auto; }
  .marker:hover, .marker:focus-visible { transform: translate(-50%, -50%) scale(1.3); outline: 2px solid #fff; outline-offset: 3px; }
  .marker.on { background: var(--dv-accent); box-shadow: 0 0 0 4px #f4c67660, 0 0 18px #f7be55; }
  .marker.kind-media.on { background: #8fc0ff; box-shadow: 0 0 0 4px #8fc0ff55, 0 0 18px #7fb4ff; }

  .hud {
    position: absolute;
    left: 2%; bottom: 2%;
    z-index: 9;
    display: flex; align-items: center; gap: 7px;
    padding: 5px;
    border-radius: 999px;
    background: #17242ac9;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .hud button, .hud select {
    color: #f1faf4;
    background: #ffffff19;
    border: 1px solid var(--dv-outline);
    border-radius: 999px;
    padding: 7px 11px;
    font: inherit; font-size: 12px;
    cursor: pointer;
  }
  .hud select { border-radius: 999px; padding: 6px 9px; }
  .hud button[aria-pressed="true"] { background: #315f58; border-color: #91bba7; }
  .counts { padding-right: 8px; font-size: 11px; color: #d3dfd8; }

  .control {
    position: absolute;
    right: 2%; bottom: 2%;
    z-index: 11;
    width: min(250px, 60%);
    padding: 10px 12px;
    border: 1px solid #66827d;
    border-radius: 11px;
    background: #192b32f2;
    color: #f4f8f5;
    box-shadow: 0 6px 22px #0008;
    font: 12px/1.35 system-ui, sans-serif;
  }
  .control[hidden], .dimmer[hidden], .control-info[hidden] { display: none; }
  .control-head { display: flex; align-items: center; gap: 6px; margin-bottom: 7px; }
  .control-name { flex: 1; font-weight: 650; }
  .control button {
    min-height: 28px;
    color: inherit;
    background: #ffffff16;
    border: 1px solid #ffffff58;
    border-radius: 7px;
    cursor: pointer;
    font: inherit;
  }
  .control-close, .control-info { width: 28px; flex: none; display: grid; place-items: center; }
  .control-info svg { width: 15px; height: 15px; fill: currentColor; }
  .control-power { width: 100%; padding: 4px 10px; }
  .control button:disabled { opacity: .55; cursor: default; }
  .dimmer { display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; align-items: center; margin-top: 8px; }
  .dimmer input { grid-column: 1 / -1; width: 100%; accent-color: var(--dv-accent); }

  .notice {
    position: absolute;
    left: 2%; bottom: 11%;
    z-index: 10;
    max-width: 80%;
    margin: 0;
    padding: 2px 7px;
    border-radius: 6px;
    background: #17242ae8;
    font-size: 11px;
    color: #ffe0cb;
  }
  .notice:empty { display: none; }

  .preview-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px 12px;
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    background: var(--dv-panel);
    color: var(--secondary-text-color, #aec4be);
    font-size: 12px;
  }
  .preview-bar:empty { display: none; }
  .preview-field { display: grid; grid-template-columns: auto 1fr auto; gap: 6px; align-items: center; }
  .preview-field input[type=range] { width: 100%; accent-color: var(--dv-accent); }
  .preview-field input[type=date], .preview-field select {
    min-width: 0;
    color: var(--primary-text-color, #eaf1ef);
    background: #263d48;
    border: 1px solid #55716f;
    border-radius: 6px;
    padding: 4px;
    font: inherit;
  }
  .preview-field output { min-width: 3ch; text-align: right; font-variant-numeric: tabular-nums; }
  .preview-actions { display: flex; flex-wrap: wrap; gap: 6px; grid-column: 1 / -1; }
  .preview-actions button {
    border: 1px solid #55716f;
    border-radius: 7px;
    background: #263d48;
    color: var(--primary-text-color, #eaf1ef);
    padding: 5px 9px;
    cursor: pointer;
    font: inherit;
  }

  .fatal {
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--error-color, #7a2f2f);
    color: #fff3ee;
    font-size: 13px;
  }
  .fatal p { margin: 6px 0 0; }
  .fatal-hint { opacity: .8; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 11px; word-break: break-all; }

  @media (max-width: 600px) {
    .chip-values { font-size: 9px; }
    .control { width: min(220px, 74%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .marker { transition: none; }
  }`;
}
