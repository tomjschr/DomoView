/* Inline SVG glyphs.
 *
 * The card runs inside a shadow root and must not depend on Home Assistant's
 * icon registry being reachable, so the handful of glyphs it needs are inlined.
 * Paths are the Material Design Icons shapes Home Assistant itself uses, which
 * keeps the card visually consistent with the rest of a dashboard.
 * MDI is licensed Apache-2.0; see NOTICE.
 */

export const ICONS = {
  windowOpen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 20V2H3V20H1V23H23V20M19 4V11H17V4M5 4H7V11H5M5 20V13H7V20M9 20V4H15V20M17 20V13H19V20Z"/></svg>',

  thermometer: '<svg viewBox="0 0 24 24" aria-hidden="true" class="stroked"><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 9v8"/></svg>',

  humidity: '<svg viewBox="0 0 24 24" aria-hidden="true" class="stroked"><path d="M12 2C9 6 5 10 5 14a7 7 0 0 0 14 0c0-4-4-8-7-12Z"/></svg>',

  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2v6Z"/></svg>',

  lightbulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7M9 21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1H9v1Z"/></svg>',
};
