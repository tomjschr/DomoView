/* Editor styles. Kept close to Home Assistant's own form density so the card
 * editor does not look pasted in next to the built-in cards. */

export function editorStyles() {
  return `
  :host { display: block; color: var(--primary-text-color, #dfe6e4); font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif); }
  * { box-sizing: border-box; }

  .editor { display: grid; gap: 8px; font-size: 14px; }

  .section {
    border: 1px solid var(--divider-color, #ffffff24);
    border-radius: 10px;
    background: var(--secondary-background-color, #ffffff08);
    overflow: hidden;
  }
  .section > summary {
    display: flex; align-items: center; gap: 8px;
    padding: 11px 13px;
    cursor: pointer;
    font-weight: 600;
    list-style: none;
  }
  .section > summary::-webkit-details-marker { display: none; }
  .section > summary::before {
    content: '';
    width: 7px; height: 7px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(-45deg);
    transition: transform .15s;
    flex: none;
  }
  .section[open] > summary::before { transform: rotate(45deg); }
  .badge {
    margin-left: auto;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--primary-color, #0e665b);
    color: var(--text-primary-color, #fff);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .body { display: grid; gap: 9px; padding: 4px 13px 14px; }

  h4 {
    margin: 8px 0 0;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--secondary-text-color, #9fb3ad);
  }
  h4:first-child { margin-top: 0; }

  .field { display: grid; grid-template-columns: minmax(96px, 38%) 1fr; gap: 4px 10px; align-items: center; }
  .field .label { font-size: 13px; }
  .field small { grid-column: 2; color: var(--secondary-text-color, #9fb3ad); font-size: 11px; }

  input[type=text], select {
    width: 100%;
    min-width: 0;
    padding: 7px 8px;
    color: var(--primary-text-color, #eaf1ef);
    background: var(--card-background-color, #223540);
    border: 1px solid var(--divider-color, #55716f);
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
  }
  input[type=text]:focus-visible, select:focus-visible {
    outline: 2px solid var(--primary-color, #4db6a4);
    outline-offset: 1px;
  }
  input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--primary-color, #0e665b); justify-self: start; }

  .entity { display: grid; grid-template-columns: 1fr auto; gap: 4px; align-items: center; }
  .entity .clear {
    width: 28px; height: 30px;
    border: 1px solid var(--divider-color, #55716f);
    border-radius: 7px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    line-height: 1;
  }

  .status { margin: 0; padding: 7px 9px; border-radius: 7px; font-size: 12px; }
  .status.ok { background: #1d4d3f66; color: #c7ecd9; }
  .status.bad { background: #5c2b2b66; color: #f4cfc6; }

  .matching { display: grid; gap: 7px; padding: 8px; border-radius: 7px; background: #0e161b66; }
  .matching small { color: var(--secondary-text-color, #9fb3ad); font-size: 11px; }
  .action {
    justify-self: start;
    padding: 6px 10px;
    border: 1px solid var(--divider-color, #55716f);
    border-radius: 7px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
  }
  .action.primary {
    border-color: var(--primary-color, #0e665b);
    background: var(--primary-color, #0e665b);
    color: var(--text-primary-color, #fff);
  }
  .match-preview {
    display: grid;
    gap: 3px;
    color: var(--secondary-text-color, #b9cdc7);
    font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
    word-break: break-word;
  }

  .diagnostics {
    margin: 4px 0 0;
    padding: 9px;
    border-radius: 7px;
    background: #0e161bcc;
    color: #b9cdc7;
    font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    white-space: pre-wrap;
    word-break: break-all;
  }

  @media (max-width: 460px) {
    .field { grid-template-columns: 1fr; }
    .field small { grid-column: 1; }
  }`;
}
