// Milky Way Fragment Shader — Photorealistic galactic band
// Enhanced brightness, richer colors, dust lanes, and galactic center glow
uniform float uTime;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vWorldPosition;

// Simplex-style noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec3 pos = normalize(vWorldPosition);
  
  // Galactic coordinates
  float galTilt = 62.87 * 3.14159 / 180.0;
  float galRA = 192.85 * 3.14159 / 180.0;
  
  float cosT = cos(galTilt);
  float sinT = sin(galTilt);
  vec3 galPos = vec3(
    pos.x * cos(galRA) + pos.z * sin(galRA),
    pos.y * cosT - (-pos.x * sin(galRA) + pos.z * cos(galRA)) * sinT,
    pos.y * sinT + (-pos.x * sin(galRA) + pos.z * cos(galRA)) * cosT
  );
  
  float galLat = asin(clamp(galPos.y, -1.0, 1.0));
  float galLon = atan(galPos.z, galPos.x);
  
  // === WIDER, BRIGHTER Milky Way band ===
  float bandWidth = 0.35;
  float band = exp(-galLat * galLat / (bandWidth * bandWidth));
  
  // === Multi-octave noise for rich structure ===
  float noise1 = snoise(vec3(galLon * 2.0, galLat * 6.0, 0.0)) * 0.5 + 0.5;
  float noise2 = snoise(vec3(galLon * 4.0, galLat * 12.0, 50.0)) * 0.5 + 0.5;
  float noise3 = snoise(vec3(galLon * 8.0, galLat * 20.0, 100.0)) * 0.5 + 0.5;
  float noise4 = snoise(vec3(galLon * 16.0, galLat * 40.0, 200.0)) * 0.5 + 0.5;
  
  float structure = noise1 * 0.4 + noise2 * 0.3 + noise3 * 0.2 + noise4 * 0.1;
  
  // === Dark dust lanes (absorption) ===
  float dustNoise = snoise(vec3(galLon * 6.0, galLat * 25.0, 300.0));
  float dustLane = smoothstep(-0.1, 0.3, dustNoise) * 0.4;
  // Dust only along the central band
  dustLane *= smoothstep(0.15, 0.0, abs(galLat));
  
  // === Galactic center (Sagittarius) — MUCH brighter ===
  float centerRA = 266.4 * 3.14159 / 180.0;
  float centerDist = abs(galLon - centerRA);
  centerDist = min(centerDist, 6.28318 - centerDist);
  float centerGlow = exp(-centerDist * centerDist / 0.4) * 0.8;
  
  // Galactic bulge
  float bulge = exp(-centerDist * centerDist / 0.15) * exp(-galLat * galLat / 0.08) * 0.5;
  
  // Combine
  float milkyWay = band * structure * (1.0 - dustLane) + centerGlow * band + bulge;
  
  // === Scattered faint background glow ===
  float bgGlow = snoise(vec3(galLon * 1.0, galLat * 3.0, 500.0)) * 0.5 + 0.5;
  bgGlow *= exp(-galLat * galLat / 1.0) * 0.08;
  milkyWay += bgGlow;
  
  // === Rich colors ===
  vec3 coolColor = vec3(0.5, 0.6, 0.9);       // Cool blue regions
  vec3 warmColor = vec3(0.9, 0.75, 0.55);      // Warm yellow/orange near center
  vec3 hotColor  = vec3(1.0, 0.95, 0.85);      // Bright white at galactic center
  vec3 dustColor = vec3(0.4, 0.25, 0.15);      // Dark brown dust lanes
  vec3 pinkColor = vec3(0.85, 0.45, 0.55);     // H-alpha emission nebulae
  
  // Color mixing
  float centerMix = smoothstep(0.0, 1.0, centerGlow);
  vec3 baseColor = mix(coolColor, warmColor, centerMix * 0.7);
  baseColor = mix(baseColor, hotColor, bulge * 1.5);
  
  // Add pinkish H-alpha regions
  float hAlpha = snoise(vec3(galLon * 3.0, galLat * 10.0, 700.0));
  hAlpha = smoothstep(0.3, 0.7, hAlpha) * band * 0.15;
  baseColor = mix(baseColor, pinkColor, hAlpha);
  
  // Add dust coloring
  baseColor = mix(baseColor, dustColor, dustLane * 0.3);
  
  // === DRAMATICALLY INCREASED BRIGHTNESS ===
  // Was 0.15 (barely visible), now 0.55 (clearly visible Milky Way)
  float alpha = milkyWay * uOpacity * 0.55;
  
  // Clamp to avoid oversaturation
  alpha = min(alpha, 0.75);
  
  gl_FragColor = vec4(baseColor, alpha);
}
