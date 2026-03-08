// Star Vertex Shader — Premium with larger sizes, FOV-responsive, and atmospheric twinkling
uniform float uTime;
uniform float uPixelRatio;
uniform float uHoveredIndex;
uniform float uFOV; // Camera field of view in degrees
uniform float uOpacity; // Layer opacity for LOD fading

attribute float aMagnitude;
attribute vec3 aColor;
attribute float aStarIndex;

varying vec3 vColor;
varying float vBrightness;
varying float vIsHovered;
varying float vOpacity;

void main() {
  vColor = aColor;
  vOpacity = uOpacity;
  
  // Check if this star is hovered
  vIsHovered = step(abs(aStarIndex - uHoveredIndex), 0.5);
  
  // Magnitude to brightness: brighter stars (lower mag) = higher brightness
  vBrightness = clamp(pow(10.0, (-aMagnitude + 6.5) / 5.0) / 1600.0, 0.05, 1.0);
  
  // === ENHANCED SIZING — Bigger, more visible stars ===
  float baseMag = 5.0 - aMagnitude; // Increased from 4.0 to 5.0
  float size = max(2.0, baseMag * 3.0 + 4.0) * uPixelRatio; // Larger base: was 1.5/2.2/3.0
  
  // Very bright stars (Sirius, Canopus, etc.) should be noticeably larger
  if (aMagnitude < 1.0) {
    size *= 1.5;
  } else if (aMagnitude < 2.0) {
    size *= 1.25;
  }
  
  // === FOV-responsive scaling ===
  float fovScale = 70.0 / max(uFOV, 15.0);
  size *= mix(1.0, fovScale, 0.6);
  
  // Pulse animation for hovered star
  float pulse = 1.0 + vIsHovered * 0.5 * sin(uTime * 4.0);
  size *= pulse;
  
  // === Atmospheric twinkling (scintillation) ===
  float t1 = sin(uTime * 3.7 + aStarIndex * 17.31) * 0.08;
  float t2 = sin(uTime * 5.3 + aStarIndex * 23.57) * 0.05;
  float t3 = sin(uTime * 1.9 + aStarIndex * 41.13) * 0.04;
  float twinkle = 1.0 + (t1 + t2 + t3);
  
  float twinkleIntensity = mix(0.3, 1.0, vBrightness);
  size *= mix(1.0, twinkle, twinkleIntensity);
  
  // Chromatic twinkling
  float colorShift = sin(uTime * 2.1 + aStarIndex * 7.77) * 0.05 * twinkleIntensity;
  vColor = vColor + vec3(colorShift, -colorShift * 0.5, colorShift * 0.3);
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
