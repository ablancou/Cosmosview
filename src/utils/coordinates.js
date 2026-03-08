/**
 * Astronomical coordinate transformation utilities.
 * All angles in radians unless otherwise noted.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const HOURS_TO_RAD = Math.PI / 12;

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) for a given Date.
 * Uses the IAU formula for sidereal time.
 * @param {Date} date - JavaScript Date object
 * @returns {number} GMST in hours (0-24)
 */
export function greenwichSiderealTime(date) {
    const JD = julianDate(date);
    const T = (JD - 2451545.0) / 36525.0;
    let gmst = 280.46061837 +
        360.98564736629 * (JD - 2451545.0) +
        0.000387933 * T * T -
        (T * T * T) / 38710000.0;
    gmst = ((gmst % 360) + 360) % 360;
    return gmst / 15.0; // Convert degrees to hours
}

/**
 * Calculate Local Sidereal Time.
 * @param {Date} date - JavaScript Date object
 * @param {number} lonDeg - Observer longitude in degrees (East positive)
 * @returns {number} LST in hours (0-24)
 */
export function localSiderealTime(date, lonDeg) {
    const gmst = greenwichSiderealTime(date);
    let lst = gmst + lonDeg / 15.0;
    lst = ((lst % 24) + 24) % 24;
    return lst;
}

/**
 * Convert Julian Date from a JavaScript Date.
 * @param {Date} date
 * @returns {number} Julian Date
 */
export function julianDate(date) {
    return date.getTime() / 86400000.0 + 2440587.5;
}

/**
 * Convert equatorial coordinates (RA/Dec) to horizontal (Alt/Az).
 * @param {number} raHours - Right Ascension in hours
 * @param {number} decDeg - Declination in degrees
 * @param {number} latDeg - Observer latitude in degrees
 * @param {number} lstHours - Local Sidereal Time in hours
 * @returns {{ alt: number, az: number }} Altitude and Azimuth in degrees
 */
export function equatorialToHorizontal(raHours, decDeg, latDeg, lstHours) {
    const ha = (lstHours - raHours) * HOURS_TO_RAD; // Hour angle in radians
    const dec = decDeg * DEG_TO_RAD;
    const lat = latDeg * DEG_TO_RAD;

    const sinAlt = Math.sin(dec) * Math.sin(lat) +
        Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
    const alt = Math.asin(sinAlt);

    const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) /
        (Math.cos(alt) * Math.cos(lat));
    let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));

    if (Math.sin(ha) > 0) {
        az = 2 * Math.PI - az;
    }

    return {
        alt: alt * RAD_TO_DEG,
        az: az * RAD_TO_DEG,
    };
}

/**
 * Convert horizontal coordinates (Alt/Az) to Cartesian (x, y, z).
 * Uses Three.js coordinate system: Y is up, Z is towards viewer.
 * @param {number} altDeg - Altitude in degrees
 * @param {number} azDeg - Azimuth in degrees (0=North, 90=East)
 * @param {number} radius - Sphere radius (default 1000)
 * @returns {{ x: number, y: number, z: number }}
 */
export function horizontalToCartesian(altDeg, azDeg, radius = 1000) {
    const alt = altDeg * DEG_TO_RAD;
    const az = azDeg * DEG_TO_RAD;

    return {
        x: -radius * Math.cos(alt) * Math.sin(az),
        y: radius * Math.sin(alt),
        z: -radius * Math.cos(alt) * Math.cos(az),
    };
}

/**
 * Convert RA/Dec directly to Cartesian coordinates on a unit sphere.
 * Used for positioning stars before rotating by sidereal time and latitude.
 * @param {number} raHours - Right Ascension in hours (0–24)
 * @param {number} decDeg - Declination in degrees (-90 to +90)
 * @param {number} radius - Sphere radius
 * @returns {{ x: number, y: number, z: number }}
 */
export function raDecToCartesian(raHours, decDeg, radius = 1000) {
    const ra = raHours * HOURS_TO_RAD;
    const dec = decDeg * DEG_TO_RAD;

    return {
        x: radius * Math.cos(dec) * Math.cos(ra),
        y: radius * Math.sin(dec),
        z: -radius * Math.cos(dec) * Math.sin(ra),
    };
}

/**
 * Compute a rotation matrix to apply to the celestial sphere
 * based on the observer's latitude and local sidereal time.
 * @param {number} latDeg - Observer latitude in degrees
 * @param {number} lstHours - Local Sidereal Time in hours
 * @returns {{ latRad: number, lstRad: number }}
 */
export function getObserverRotation(latDeg, lstHours) {
    return {
        latRad: (90 - latDeg) * DEG_TO_RAD,
        lstRad: lstHours * HOURS_TO_RAD,
    };
}

/**
 * Format degrees to DMS string.
 * @param {number} deg
 * @returns {string}
 */
export function degToDMS(deg) {
    const sign = deg >= 0 ? '+' : '-';
    const absDeg = Math.abs(deg);
    const d = Math.floor(absDeg);
    const m = Math.floor((absDeg - d) * 60);
    const s = Math.round(((absDeg - d) * 60 - m) * 60);
    return `${sign}${d}° ${m}' ${s}"`;
}

/**
 * Format hours to HMS string.
 * @param {number} hours
 * @returns {string}
 */
export function hoursToHMS(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.round(((hours - h) * 60 - m) * 60);
    return `${h}h ${m}m ${s}s`;
}

export { DEG_TO_RAD, RAD_TO_DEG, HOURS_TO_RAD };
