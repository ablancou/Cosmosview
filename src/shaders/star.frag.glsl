// Star Fragment Shader — Photorealistic with soft glow and diffraction spikes
varying vec3 vColor;
varying float vBrightness;
varying float vIsHovered;
varying float vOpacity;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  // Discard outside circle
  if (dist > 0.5) discard;
  
  // === ENHANCED CORE — brighter, sharper center ===
  float coreGlow = exp(-dist * dist * 20.0); // Sharper core: 16 → 20
  
  // === LARGER, BRIGHTER HALO ===
  float halo = exp(-dist * dist * 4.0) * 0.6; // Wider halo: 5→4, brighter: 0.5→0.6
  
  // === OUTER SOFT GLOW for very bright stars ===
  float outerGlow = exp(-dist * 2.5) * 0.25 * vBrightness;
  
  // === Diffraction spikes for bright stars (mag < 2) ===
  float spikeIntensity = 0.0;
  if (vBrightness > 0.25) {
    vec2 uv = gl_PointCoord - 0.5;
    
    // Four-pointed spike (cross pattern) — longer, more visible
    float spike1 = exp(-abs(uv.y) * 35.0) * exp(-abs(uv.x) * 6.0);
    float spike2 = exp(-abs(uv.x) * 35.0) * exp(-abs(uv.y) * 6.0);
    
    // Diagonal spikes
    float diag1 = exp(-abs(uv.x - uv.y) * 25.0) * exp(-abs(uv.x + uv.y) * 8.0);
    float diag2 = exp(-abs(uv.x + uv.y) * 25.0) * exp(-abs(uv.x - uv.y) * 8.0);
    
    spikeIntensity = (spike1 + spike2) * 0.7 + (diag1 + diag2) * 0.25;
    spikeIntensity *= (vBrightness - 0.25) * 1.6;
    spikeIntensity *= smoothstep(0.5, 0.1, dist);
  }
  
  // Combine core, halo, outer glow, and spikes
  float glow = coreGlow + halo * vBrightness + outerGlow + spikeIntensity;
  
  // Gold highlight for hovered stars
  vec3 hoverColor = vec3(1.0, 0.85, 0.49);
  vec3 finalColor = mix(vColor, hoverColor, vIsHovered * 0.7);
  
  // Chromatic aberration for very bright stars
  vec3 chromatic = finalColor;
  if (vBrightness > 0.4) {
    float ca = (vBrightness - 0.4) * 0.4;
    chromatic.r += ca * exp(-dist * dist * 6.0) * 0.35;
    chromatic.b += ca * exp(-dist * dist * 10.0) * 0.25;
  }
  
  // === BOOSTED BRIGHTNESS — stars overall more visible ===
  float alpha = glow * (0.6 + vBrightness * 0.4); // Was 0.5 + vB * 0.5
  
  // Ensure very bright stars are fully opaque at center
  alpha = min(alpha * 1.3, 1.0);
  
  // Boost hovered star
  alpha = mix(alpha, min(alpha * 2.0, 1.0), vIsHovered);
  
  gl_FragColor = vec4(chromatic * glow, alpha * vOpacity);
}
