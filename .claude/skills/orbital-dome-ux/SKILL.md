# Orbital Dome — UX & Design Requirements

> Use this skill whenever working on Orbital Dome (orbitaldome.com / Cosmosview).
> These are mandatory design rules established by the project owner.

---

## 1. Menus & Panels Must Never Block the Main View

- **On mobile**: sidebars, legends, satellite panels, and any overlay UI must be **hidden by default**. Show them only when the user taps a toggle button (hamburger, icon, etc.).
- **On desktop**: panels can be visible by default but must use a **side-by-side layout** (flex horizontal), never overlap the 3D canvas or main sky view.
- Panels that slide in should slide from the edge they are anchored to (right-anchored panels slide from right, left from left).
- The 3D visualization (Earth globe, Moon globe, sky view, solar system) is always the hero — it must be **fully visible and unobstructed** at all times unless the user explicitly opens a panel.

## 2. Responsive Design (Mobile-First)

- Every component must work on these breakpoints:
  - **Mobile**: < 640px (single column, collapsible panels, touch-friendly targets >= 44px)
  - **Tablet**: 640–1024px (panels can be toggleable sidebars)
  - **Desktop**: > 1024px (side-by-side layouts allowed)
- Never use fixed pixel widths that break on small screens (no `w-[740px]` without `max-w-[95vw]`).
- Full-screen features (Solar System, Earth Observatory, Moon Globe) should use `calc(100vw - 32px)` / `calc(100vh - 32px)` or `inset-0`, not constrained boxes.
- Touch targets: minimum 44x44px for all interactive elements on mobile.

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
- When telling the user to push, **always give the full correct path**. The project folder on the user's Mac is called `Cosmosview`. Instruct the user to first find it:
  ```bash
  find ~ -maxdepth 3 -name "Cosmosview" -type d 2>/dev/null
  ```
  Then push:
  ```bash
  cd [path found above] && git push
  ```
- **NEVER assume** the folder is at `~/Cosmosview` or `~/Desktop/Cosmosview` without confirming.
- After push + Vercel deploy, remind user to **hard refresh** (Cmd+Shift+R on Mac, Ctrl+Shift+R on PC) to bypass browser cache.
- `node_modules` are compiled for macOS ARM64 — **never run `npm install` or `npm run build`** inside the Linux sandbox.

## 13. General Principles

- The 3D visualization is always the star — never obscure it with UI.
- Educational content (mission info, tooltips) should enhance, not clutter.
- Interactions should feel smooth and responsive — no jank, no layout shifts.
- Always test mental model: "If I were a user on a phone, can I see the globe clearly when I open this feature?"
- Always recommend the **best, most innovative, and technologically advanced** approach — but it must be **100% free**.
- All data must be **scientifically accurate** — use real astronomical algorithms, real NASA data, real orbital mechanics. No fake or placeholder data.
