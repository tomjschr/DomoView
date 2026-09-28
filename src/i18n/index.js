/* Card translations. Home Assistant exposes the active language on `hass`,
 * so the card follows the user's own setting and falls back to English.
 * Adding a language means adding one object and one entry in TRANSLATIONS. */

import en from './en.js';
import de from './de.js';

const TRANSLATIONS = { en, de };

export const LANGUAGES = Object.keys(TRANSLATIONS);

export function createTranslator(language) {
  const primary = TRANSLATIONS[String(language || '').slice(0, 2).toLowerCase()] || en;
  return function t(key, values) {
    const template = primary[key] ?? en[key] ?? key;
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      (Object.hasOwn(values, name) ? String(values[name]) : match));
  };
}

/** Locale-aware number formatting, so 21.4 °C reads right in every language. */
export function createFormatter(language) {
  const locale = language || 'en';
  return {
    temperature: value => new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1, maximumFractionDigits: 1,
    }).format(value),
    percent: value => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value),
    time: date => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date),
  };
}
