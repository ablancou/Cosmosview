# Orbital Dome — UX & Design Requirements

> Use this skill whenever working on Orbital Dome (orbitaldome.com / Cosmosview).
> These are mandatory design rules established by the project owner.

---

## 1. Menus & Panels Must Never Block the Main View

- **On mobile**: sidebars, legends, satellite panels, and any overlay UI must be **hidden by default**. Show them only when the user taps a toggle button (hamburger, icon, etc.).
- **On desktop**: panels can be visible by default but must use a **side-by-side layout** (flex horizontal), never overlap the 3D canvas or main sky view.
- Panels that slide in should slide from the edge they are anchored to (right-anchored panels slide from right, left from left).
- The 3D visualization (Earth globe, Moon globe, sky view, solar system) is always the hero — it must be **fully visible and unobstructed** at all times unless the user explicitly opens a panel.

## 2. Responsive Design — ALL THREE VIEWPORTS ARE MANDATORY

> **CRITICAL RULE**: Every single feature, component, and panel MUST work flawlessly on ALL three viewport modes. No exceptions. If it doesn't work on all three, it is not ready for deployment.

### 2a. Required Viewport Modes

- **Desktop** (> 1024px): Side-by-side layouts allowed. Full visual fidelity.
- **Mobile Portrait** (< 640px width): Single column, collapsible panels, touch-friendly targets ≥ 44px.
- **Mobile Landscape** (< 640px height, width > height): Horizontal layout with compact UI. Panels must not consume more than 40% of screen width. 3D visualizations must remain the dominant element.
- **Tablet** (640–1024px): Panels can be toggleable sidebars.

### 2b. Mandatory Responsive Checklist (for EVERY component)

1. **Test mentally in all 3 modes** before writing any JSX: "Does this look good on desktop? Portrait phone? Landscape phone?"
2. Never use fixed pixel widths that break on small screens (no `w-[740px]` without `max-w-[95vw]`).
3. Full-screen features (Solar System, Earth Observatory, Moon Globe, Lunar Flyover, Asteroid Tracker, Exoplanet Explorer) must use `inset-0` or `100vw`/`100vh`, never constrained boxes.
4. Touch targets: minimum 44×44px for all interactive elements on mobile.
5. Text must remain readable — minimum `text-xs` (12px) on mobile, never smaller.
6. Scrollable panels must use `overflow-y-auto` and `max-h-[60vh]` on portrait, `max-h-[80vh]` on landscape.
7. Close/dismiss buttons must be easily reachable with one thumb (bottom half of screen on mobile).

### 2c. Mobile-Specific Three.js Rules (CRITICAL — prevents crashes)

These rules exist because past violations caused the entire app to stop loading on iPhone:

1. **React hooks ordering**: ALL `useState`, `useRef`, `useEffect`, `useMemo`, `useCallback` calls MUST be declared BEFORE any conditional `return` statement. Placing `if (!open) return null` before hooks violates React's rules of hooks and crashes the entire app.
2. **Variable declaration order**: `const` variables are NOT hoisted. Never reference a `const` before its declaration line. Safari/iOS is stricter about this than Chrome.
3. **Geometry complexity**: Use `≤ 16` subdivisions for `IcosahedronGeometry` / `SphereGeometry` on mobile (32+ on desktop only).
4. **Pixel ratio clamping**: Always `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
5. **Antialiasing**: Disable on mobile (`antialias: !isMobile`).
6. **Texture sizes**: Max 4K on mobile, 8K on desktop only. Use progressive loading (2K → 4K → 8K).
7. **WebGL cleanup**: Every `useEffect` that creates a renderer MUST return a cleanup function that calls `renderer.forceContextLoss()`, `renderer.dispose()`, and traverses the scene to dispose all geometries/materials/textures.
8. **Mobile detection pattern**:
   ```javascript
   const [isMobile] = useState(
     typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
   );
   ```

### 2d. Landscape-Specific Rules

- Info panels in landscape mode must be **side-anchored** (left or right), never bottom-sheet style (which would consume too much vertical space).
- HUD overlays (altitude, coordinates, telemetry) must reflow to a single compact row in landscape.
- Control buttons must be arranged horizontally in landscape, not stacked vertically.
- The 3D canvas must always occupy at least 60% of the viewport in landscape mode.

## 3. Navigation Pattern — Speed Dial FAB

- The main navigation uses a **speed-dial FAB** pattern (bottom-right floating action button).
- Items stack vertically upward when expanded, each with a label pill + circular icon.
- Items must never overflow outside the viewport.
- The old radial menu is deprecated — never use `getRadialPositions()` or radial arc placement.
- Categories: Celestial, Atmosphere, Tools, Settings, with sub-items opening vertically.

## 4. Internationalization (i18n)

- The app supports **8 languages**: en, es, fr, de, it, pt, ja, zh.
- All user-facing text must use `useTranslation()` from react-i18next with `t('key', 'English fallback')`.
- Never hardcode text in any single language (including Spanish).
- Translation files are in `src/locales/{lang}/translation.json`.

## 5. Three.js Best Practices

- Use **MeshStandardMaterial** for reliability. Avoid custom GLSL shaders unless absolutely necessary (they have caused syntax bugs before).
- Landing site markers: use `SphereGeometry(0.025–0.03)` for dots, not larger. Giant spheres (0.08+) look broken.
- Always include ambient light (even dim, ~0.08–0.10) so objects are never completely invisible.
- For procedural textures, use Canvas API + `THREE.CanvasTexture`. Works reliably across browsers.
- When animating, avoid `Math.sin(Date.now() * factor)` applied every frame for positions — it causes visible shake. Only use for subtle opacity pulsing.
- Dispose all geometries, materials, and textures in the cleanup function of useEffect.

## 6. Astronomy Calculations

- Use `astronomy-engine` library.
- Wrap ALL astronomy calls in try/catch with sensible fallback values:
  - Distance: 384,400 km
  - Illumination: 50%
  - Phase: 90° (First Quarter)
- `Astronomy.Illumination()` may not have `phase_fraction` in all versions — always provide a fallback formula: `(1 - Math.cos(phaseDeg * PI / 180)) / 2 * 100`.
- `Astronomy.GeoMoon()` returns equatorial position vector; calculate distance manually: `sqrt(x² + y² + z²) * 149597870.7`.
- Validate computed distances are in reasonable range (300,000–500,000 km).

## 7. Visual Design Language

- Dark theme: backgrounds `#060610` to `rgba(10,12,30,0.98)`.
- Text hierarchy: white for primary, white/50–60 for secondary, white/25–35 for tertiary.
- Borders: `border-white/[0.06]` to `border-white/10`.
- Cards: `bg-white/[0.03]` with subtle borders.
- Accent colors per category: apollo=green (#22dd77), luna=orange (#ffaa33), change=blue (#4499ff).
- Labels use `text-[9px]` to `text-[10px]` uppercase tracking-widest for section headers.
- Font: system default, monospace for numeric data (`font-mono`).

## 8. Animation & Interaction

- CSS animations: use `animate-fadeIn` for panel reveals.
- `slide-right` animation: panels anchored right use `translateX(100%)` → `translateX(0)`, NOT `translateX(-100%)`.
- Smooth globe rotation when focusing on a site: use `requestAnimationFrame` with easeInOutCubic over ~800ms.
- Inertia on drag: multiply velocity by 0.96 each frame.
- Auto-rotate when idle: very slow, ~0.0004–0.0005 rad/frame.

## 9. PWA & Performance

- Build tool: Vite.
- State management: Zustand (`useAppStore`).
- node_modules are compiled for macOS ARM64 — cannot `npm install` or build inside Linux sandbox.
- Git → GitHub → Vercel auto-deploy pipeline.
- After pushing changes, remind user to **hard-refresh** (Cmd+Shift+R) or clear browser cache to see updates.

## 10. Component Layout Rules

- **Earth Observatory**: flex horizontal — sidebar left, globe right. On mobile: globe full-screen, sidebar is a toggleable overlay triggered by a button.
- **Moon Globe**: same pattern — sidebar left, canvas right. On mobile: canvas full, sidebar toggleable.
- **Solar System Orrery**: near full-screen, max-width 1600px.
- **Sky View**: the main view, always full viewport.
- Headers within panels: part of the flex flow, never `absolute` positioned overlapping other content.

## 11. Satellite Legend (Earth Observatory Specific)

- Each satellite category (ISS, Hubble, Tiangong, GPS, Starlink, GLONASS, GEO Ring, Polar) has a toggle eye icon.
- On **mobile**: the entire legend panel is **collapsed by default**. A small floating button (e.g., satellite icon) in the corner reveals it.
- On **desktop**: legend can be a compact sidebar or bottom strip, not a large overlay on the globe.
- "Show ALL satellites (~8,000+)" button loads additional TLE data on demand.

## 12. Git & Deployment Workflow

- **Repository**: `https://github.com/ablancou/Cosmosview.git` (branch: `main`)
- **Deploy pipeline**: Git push → GitHub → Vercel auto-deploy
- **CRITICAL: Claude CANNOT `git push`** — the sandbox has no network access to github.com (returns HTTP 403). All commits are local only.
- The project folder on the user's Mac is at: **`~/Documents/Antigravity Projects/Cosmosview`**
- The ONLY correct push command is:
  ```bash
  cd ~/Documents/Antigravity\ Projects/Cosmosview && git push
  ```
- **NEVER use any other path.** This has been confirmed multiple times by the user.
- After push + Vercel deploy, remind user to **hard refresh** (Cmd+Shift+R on Mac, Ctrl+Shift+R on PC) to bypass browser cache.
- `node_modules` are compiled for macOS ARM64 — **never run `npm install` or `npm run build`** inside the Linux sandbox.

## 13. General Principles

- The 3D visualization is always the star — never obscure it with UI.
- Educational content (mission info, tooltips) should enhance, not clutter.
- Interactions should feel smooth and responsive — no jank, no layout shifts.
- Always test mental model: "If I were a user on a phone, can I see the globe clearly when I open this feature?"
- Always recommend the **best, most innovative, and technologically advanced** approach — but it must be **100% free**.
- All data must be **scientifically accurate** — use real astronomical algorithms, real NASA data, real orbital mechanics. No fake or placeholder data.

## 14. Pre-Commit Quality Gate — Viewport Compliance

Before any component is considered complete, mentally verify:

| Check | Desktop | Portrait Mobile | Landscape Mobile |
|-------|---------|-----------------|------------------|
| 3D canvas visible and unobstructed | ✅ | ✅ | ✅ |
| Panels don't cover visualization | ✅ | ✅ | ✅ |
| All hooks declared before conditional returns | ✅ | ✅ | ✅ |
| `const` variables declared before use | ✅ | ✅ | ✅ |
| Touch targets ≥ 44px | — | ✅ | ✅ |
| Geometry ≤ 16 subdivisions on mobile | — | ✅ | ✅ |
| Pixel ratio clamped to 2 | — | ✅ | ✅ |
| Antialiasing disabled on mobile | — | ✅ | ✅ |
| WebGL cleanup in useEffect return | ✅ | ✅ | ✅ |
| Textures max 4K on mobile | — | ✅ | ✅ |
| Close button reachable with thumb | — | ✅ | ✅ |
| No text smaller than 12px | ✅ | ✅ | ✅ |

**If ANY cell would be ❌, the component is NOT ready. Fix it before proceeding.**
