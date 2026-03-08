// Atmospheric Scattering Fragment Shader
// Rayleigh + Mie scattering for realistic sky gradients
// Based on the Nishita sky model

uniform vec3 uSunDirection;   // Normalized sun direction
uniform float uSunAltitude;   // Sun altitude in degrees
uniform float uIntensity;     // Overall intensity

varying vec3 vWorldPosition;
varying vec2 vUv;

// Rayleigh scattering coefficients (wavelength-dependent)
const vec3 RAYLEIGH = vec3(5.5e-6, 13.0e-6, 22.4e-6); // RGB
const float MIE = 21e-6;

// Scale height
const float HR = 8500.0;  // Rayleigh
const float HM = 1200.0;  // Mie

vec3 nightSkyColor(float altitude) {
  // Deep blue-to-black gradient at night
  float t = clamp((altitude + 18.0) / 18.0, 0.0, 1.0);
  vec3 nightDeep = vec3(0.01, 0.015, 0.04);
  vec3 twilight = vec3(0.03, 0.04, 0.12);
  return mix(nightDeep, twilight, t * t);
}

vec3 twilightColor(float sunAlt, float viewAlt) {
  // Civil twilight: -6° to 0°
  // Nautical: -12° to -6°
  // Astronomical: -18° to -12°
  
  float civilFactor = smoothstep(-6.0, 0.0, sunAlt);
  float nauticalFactor = smoothstep(-12.0, -6.0, sunAlt);
  
  // Horizon glow
  float horizonGlow = exp(-abs(viewAlt) * 0.15);
  
  // Colors
  vec3 deepTwilight = vec3(0.02, 0.03, 0.10);
  vec3 nauticalBlue = vec3(0.05, 0.08, 0.25);
  vec3 civilBlue = vec3(0.15, 0.25, 0.55);
  vec3 sunsetOrange = vec3(0.8, 0.35, 0.1);
  vec3 sunsetPink = vec3(0.7, 0.3, 0.35);
  
  vec3 skyColor = mix(deepTwilight, nauticalBlue, nauticalFactor);
  skyColor = mix(skyColor, civilBlue, civilFactor);
  
  // Add warm horizon glow during twilight
  float warmth = horizonGlow * civilFactor;
  skyColor = mix(skyColor, sunsetOrange, warmth * 0.4);
  skyColor = mix(skyColor, sunsetPink, warmth * horizonGlow * 0.2);
  
  return skyColor;
}

vec3 daytimeColor(float sunAlt, float viewAlt) {
  // Rayleigh-inspired blue sky
  float zenithFactor = clamp(viewAlt / 90.0, 0.0, 1.0);
  
  vec3 horizonColor = vec3(0.5, 0.65, 0.85);
  vec3 zenithColor = vec3(0.15, 0.35, 0.75);
  vec3 brightSky = vec3(0.4, 0.6, 0.95);
  
  // Higher sun = brighter sky
  float sunBright = clamp(sunAlt / 60.0, 0.0, 1.0);
  vec3 sky = mix(horizonColor, zenithColor, zenithFactor);
  sky = mix(sky * 0.7, sky, sunBright);
  
  return sky;
}

void main() {
  // View altitude approximation from UV
  float viewAlt = (vUv.y - 0.5) * 180.0; // -90 to +90
  
  vec3 color;
  float alpha;
  
  if (uSunAltitude < -18.0) {
    // Full night — minimal atmosphere
    color = nightSkyColor(viewAlt);
    alpha = 0.15;
  } else if (uSunAltitude < 0.0) {
    // Twilight — beautiful gradient
    color = twilightColor(uSunAltitude, viewAlt);
    float twilightIntensity = smoothstep(-18.0, 0.0, uSunAltitude);
    alpha = mix(0.15, 0.6, twilightIntensity);
  } else {
    // Daytime — Rayleigh blue
    color = daytimeColor(uSunAltitude, viewAlt);
    float dayIntensity = smoothstep(0.0, 20.0, uSunAltitude);
    alpha = mix(0.6, 0.95, dayIntensity);
  }
  
  // Sun glow near horizon
  if (uSunAltitude > -10.0 && uSunAltitude < 15.0) {
    float horizonProximity = exp(-abs(viewAlt) * 0.1);
    float sunGlow = horizonProximity * smoothstep(-10.0, 5.0, uSunAltitude);
    
    vec3 glowColor = uSunAltitude < 0.0 
      ? vec3(0.9, 0.4, 0.15)   // Pre-sunrise orange
      : vec3(0.95, 0.8, 0.5);  // Daytime warm
    
    color = mix(color, glowColor, sunGlow * 0.3);
  }
  
  color *= uIntensity;
  gl_FragColor = vec4(color, alpha * uIntensity);
}
