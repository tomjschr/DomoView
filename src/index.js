/* Bundle entry point. HACS installs exactly one file as a dashboard resource,
 * so both the card and its editor are registered from here. */

import './domoview-card.js';
import './domoview-editor.js';

export { DomoViewCard, VERSION } from './domoview-card.js';
export { DomoViewCardEditor } from './domoview-editor.js';
export { loadPack, normalisePack, inspectPack, SCHEMA_VERSION } from './core/pack.js';
export { HomeState } from './core/hass.js';
