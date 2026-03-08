/**
 * Maps stellar spectral types and color indices to RGB colors.
 * Based on blackbody approximations and observational data.
 */

/**
 * Color table mapping spectral types to approximate RGB values.
 * Source: Harre & Heller (2021), approximate visual colors.
 */
const SPECTRAL_COLORS = {
    O: { r: 0.61, g: 0.69, b: 1.0 },   // Blue
    B: { r: 0.67, g: 0.75, b: 1.0 },   // Blue-white
    A: { r: 0.80, g: 0.85, b: 1.0 },   // White
    F: { r: 1.00, g: 0.97, b: 0.91 },  // Yellow-white
    G: { r: 1.00, g: 0.91, b: 0.73 },  // Yellow
    K: { r: 1.00, g: 0.76, b: 0.50 },  // Orange
    M: { r: 1.00, g: 0.56, b: 0.34 },  // Red
    L: { r: 0.90, g: 0.40, b: 0.25 },  // Dark red
    T: { r: 0.80, g: 0.35, b: 0.30 },  // Magenta-brown
    W: { r: 0.55, g: 0.65, b: 1.0 },   // Wolf-Rayet (blue)
    C: { r: 1.00, g: 0.60, b: 0.30 },  // Carbon star (orange-red)
    S: { r: 1.00, g: 0.55, b: 0.32 },  // S-type (similar to M)
};

/**
 * Get an RGB color for a given spectral type string.
 * @param {string} spectralType - e.g., "A1V", "K5III", "M2Ia"
 * @returns {{ r: number, g: number, b: number }} RGB values (0-1)
 */
export function getStarColor(spectralType) {
    if (!spectralType || spectralType.length === 0) {
        return SPECTRAL_COLORS.G; // Default to Sun-like
    }
    const firstChar = spectralType.charAt(0).toUpperCase();
    return SPECTRAL_COLORS[firstChar] || SPECTRAL_COLORS.G;
}

/**
 * Convert B-V color index to approximate RGB.
 * Uses a polynomial approximation of blackbody radiation.
 * @param {number} ci - B-V color index (typically -0.4 to 2.0)
 * @returns {{ r: number, g: number, b: number }} RGB values (0-1)
 */
export function colorIndexToRGB(ci) {
    // Approximate temperature from B-V color index
    const t = 4600 * (1 / (0.92 * ci + 1.7) + 1 / (0.92 * ci + 0.62));

    // Convert temperature to RGB using Planckian approximation
    let r, g, b;

    // Red
    if (t >= 6600) {
        r = 1.0;
    } else {
        r = Math.pow(t / 6600, -0.133);
        r = Math.max(0, Math.min(1, 329.698727446 * r / 255));
    }

    // Fallback to spectral mapping for better visual results
    if (ci < -0.3) return SPECTRAL_COLORS.O;
    if (ci < -0.02) return SPECTRAL_COLORS.B;
    if (ci < 0.15) return SPECTRAL_COLORS.A;
    if (ci < 0.44) return SPECTRAL_COLORS.F;
    if (ci < 0.68) return SPECTRAL_COLORS.G;
    if (ci < 1.15) return SPECTRAL_COLORS.K;
    return SPECTRAL_COLORS.M;
}

/**
 * Calculate star brightness multiplier from apparent magnitude.
 * Uses logarithmic scale where each magnitude step is ~2.512x brightness.
 * @param {number} magnitude - Apparent visual magnitude
 * @returns {number} Brightness factor (0-1)
 */
export function magnitudeToBrightness(magnitude) {
    // Normalize: mag -1.5 → 1.0, mag 6.5 → 0.05
    const normalized = Math.pow(10, (-magnitude + 6.5) / 5);
    return Math.min(1.0, Math.max(0.05, normalized / 1600));
}

/**
 * Calculate star point size from apparent magnitude.
 * Brighter stars should appear larger.
 * @param {number} magnitude - Apparent visual magnitude
 * @param {number} baseSizePx - Base size in pixels
 * @param {boolean} isMobile - Whether on mobile (smaller sizes)
 * @returns {number} Point size in pixels
 */
export function magnitudeToSize(magnitude, baseSizePx = 4.0, isMobile = false) {
    const scale = isMobile ? 0.7 : 1.0;
    // Brighter (lower mag) = bigger
    const size = baseSizePx * Math.pow(10, (0 - magnitude) / 5) * scale;
    return Math.max(0.5, Math.min(baseSizePx * 3 * scale, size));
}

export default SPECTRAL_COLORS;
