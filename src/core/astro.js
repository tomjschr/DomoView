/* Solar and lunar position from time and place.
 *
 * Home Assistant's sun.sun already publishes azimuth and elevation, so the
 * card prefers those. These routines cover the preview mode, homes without a
 * sun entity, and the moon, for which no core entity reports a position.
 *
 * Both use the low-precision series from the Astronomical Almanac / Meeus,
 * in the compact arrangement popularised by suncalc. Accuracy is well within
 * a tenth of a degree, which is far finer than a rendered sun patch needs.
 * Reference: https://github.com/mourner/suncalc
 */

const RAD = Math.PI / 180;
const J2000 = 2451545;
const OBLIQUITY = 23.4397 * RAD;

/** Julian days since J2000 for a JS Date. */
function daysSinceJ2000(date) {
  return date.getTime() / 86400000 + 2440587.5 - J2000;
}

function siderealTime(days, longitudeRad) {
  return (280.16 + 360.9856235 * days) * RAD + longitudeRad;
}

/** Atmospheric refraction lift near the horizon, in radians. */
function refract(altitude) {
  if (altitude < -0.05) return altitude;
  return altitude + 0.0002967 / Math.tan(altitude + 0.00312536 / (altitude + 0.08901179));
}

function horizontal(hourAngle, latitudeRad, declination) {
  const altitude = Math.asin(
    Math.sin(latitudeRad) * Math.sin(declination) +
    Math.cos(latitudeRad) * Math.cos(declination) * Math.cos(hourAngle),
  );
  // Measured clockwise from geographic north, matching Home Assistant's sun.sun.
  const azimuth = (Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitudeRad) - Math.tan(declination) * Math.cos(latitudeRad),
  ) / RAD + 540) % 360;
  return { azimuth, altitude };
}

export function sunPosition(date, latitude, longitude) {
  const days = daysSinceJ2000(date);
  const meanAnomaly = (357.5291 + 0.98560028 * days) * RAD;
  const eclipticLongitude = meanAnomaly +
    (1.9148 * Math.sin(meanAnomaly) +
     0.02 * Math.sin(2 * meanAnomaly) +
     0.0003 * Math.sin(3 * meanAnomaly)) * RAD +
    102.9372 * RAD + Math.PI;
  const declination = Math.asin(Math.sin(OBLIQUITY) * Math.sin(eclipticLongitude));
  const rightAscension = Math.atan2(
    Math.sin(eclipticLongitude) * Math.cos(OBLIQUITY),
    Math.cos(eclipticLongitude),
  );
  const hourAngle = siderealTime(days, longitude * RAD) - rightAscension;
  const { azimuth, altitude } = horizontal(hourAngle, latitude * RAD, declination);
  return { azimuth, elevation: refract(altitude) / RAD };
}

export function moonPosition(date, latitude, longitude) {
  const days = daysSinceJ2000(date);
  const meanLongitude = (218.316 + 13.176396 * days) * RAD;
  const meanAnomaly = (134.963 + 13.064993 * days) * RAD;
  const meanDistance = (93.272 + 13.229350 * days) * RAD;
  const eclipticLongitude = meanLongitude + 6.289 * RAD * Math.sin(meanAnomaly);
  const eclipticLatitude = 5.128 * RAD * Math.sin(meanDistance);
  const rightAscension = Math.atan2(
    Math.sin(eclipticLongitude) * Math.cos(OBLIQUITY) -
      Math.tan(eclipticLatitude) * Math.sin(OBLIQUITY),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(
    Math.sin(eclipticLatitude) * Math.cos(OBLIQUITY) +
    Math.cos(eclipticLatitude) * Math.sin(OBLIQUITY) * Math.sin(eclipticLongitude),
  );
  const hourAngle = siderealTime(days, longitude * RAD) - rightAscension;
  const { azimuth, altitude } = horizontal(hourAngle, latitude * RAD, declination);
  return { azimuth, elevation: refract(altitude) / RAD };
}

/** Home Assistant's sensor.moon_phase vocabulary, as illuminated fraction. */
const PHASE_FRACTIONS = {
  new_moon: 0,
  waxing_crescent: 0.16,
  first_quarter: 0.5,
  waxing_gibbous: 0.82,
  full_moon: 1,
  waning_gibbous: 0.82,
  last_quarter: 0.5,
  waning_crescent: 0.16,
};

/**
 * Illuminated fraction of the lunar disc. A phase entity, when present, is
 * more trustworthy than the mean synodic approximation below.
 */
export function moonIllumination(date, phaseState = null) {
  if (phaseState && Object.hasOwn(PHASE_FRACTIONS, phaseState)) return PHASE_FRACTIONS[phaseState];
  const reference = Date.UTC(2000, 0, 6, 18, 14);
  const lunation = 29.530588853 * 86400000;
  const phase = (((date.getTime() - reference) % lunation) + lunation) % lunation / lunation;
  return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

/** Warm the sun towards the horizon, the way low-elevation daylight actually reads. */
export function sunlightColor(elevation) {
  if (elevation >= 25) return [255, 244, 224];
  if (elevation >= 15) return [255, 232, 196];
  if (elevation >= 6) return [255, 214, 162];
  return [255, 190, 138];
}

export const MOONLIGHT_COLOR = [172, 200, 255];
