# Orbital Dome — Portfolio Project Description

**Live:** [orbitaldome.com](https://orbitaldome.com)
**Repository:** [github.com/ablancou/Cosmosview](https://github.com/ablancou/Cosmosview)
**Author:** Armando Blanco

---

## Overview

Orbital Dome is a browser-based planetarium and space exploration platform built as a Progressive Web App. It renders an interactive, scientifically accurate night sky with 100,000+ real stars, real-time planetary positions, 3D visualizations, satellite tracking, and 25+ features — all running client-side in the browser with zero backend. Available in 8 languages, fully accessible, and 100% free with no accounts required.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 with functional components and hooks |
| 3D Rendering | Three.js (WebGL) with custom GLSL shaders |
| Astronomy | astronomy-engine (real ephemeris calculations) |
| Orbital Mechanics | satellite.js (SGP4/SDP4 propagation) |
| State Management | Zustand |
| Internationalization | i18next (8 languages) |
| Styling | Tailwind CSS 4 + inline glassmorphic design system |
| Build | Vite 6 |
| Deployment | Vercel (auto-deploy from GitHub) |
| Data | NASA APIs, CelesTrak TLEs, HYG Star Catalog, Messier/NGC catalogs |

---

## Architecture

62 React components organized into rendering layers, interactive panels, tools, and educational modules. The app uses a single Zustand store for global state (location, time, layers, selections, display modes) with computed astronomical values derived in real time. Three.js renders the sky canvas with post-processing (bloom on desktop, disabled on mobile for performance). All astronomical calculations use real algorithms — no hardcoded positions.

---

## Core Features (25+)

### 3D Visualizations (Flagship)

- **Earth Observatory** — Photorealistic 3D globe with day/night terminator, atmospheric Rayleigh scattering, cloud layer, and 30+ real-time satellite orbits (ISS, Hubble, Starlink, GPS, GLONASS, GEO, polar) using SGP4 orbital propagation from NORAD TLE data.

- **Lunar Observatory** — NASA-textured 3D Moon with real libration calculated via `Astronomy.Libration()`, 6 Apollo/Luna/Chang'e landing sites with interactive mission info cards, live phase illumination, distance, and apparent diameter.

- **Solar System Orrery** — All 8 planets orbiting the Sun in accurate real-time positions from JPL ephemeris algorithms. Elliptical orbit paths, planetary data overlays, smooth 3D camera controls.

- **Orbital Tracker** — Full-screen 3D satellite visualization with ~30 major satellites, wireframe Earth with continent outlines, real-time SGP4 propagation, and cyberpunk HUD telemetry display. Color-coded by orbit type (LEO, L2, GEO).

- **Asteroid Tracker** — 3D visualization of 10 real Near-Earth Objects (Apophis, Bennu, Didymos, Ryugu, Eros, Phaethon, etc.) with Kepler orbital mechanics, hazard classification, close-approach dates, and NASA mission context.

- **Exoplanet Explorer** — Interactive 3D star systems featuring 21 confirmed exoplanets across 9 real systems (TRAPPIST-1's 7 worlds, Proxima Centauri b, 51 Pegasi b, Tau Ceti, Kepler-442b, etc.). Habitable zone visualization, orbit animations, Earth-size comparisons.

### Sky Rendering Engine

- **100,000+ stars** from the HYG v3 catalog with GPU-accelerated instanced rendering, magnitude-based sizing, and spectral-type color mapping via custom vertex/fragment shaders.
- **48 IAU constellations** with traditional line figures and mythology database.
- **110+ Messier objects + NGC/IC** deep-sky catalog as categorized glow sprites (galaxies, nebulae, star clusters, supernova remnants).
- **Procedural Milky Way** with dust lanes and galactic bulge via custom GLSL shader.
- **Aurora borealis** animated with 5 vertex-shader curtain ribbons.
- **Realistic atmosphere** — Rayleigh/Mie scattering, horizon glow, day/night sky transitions.
- **Shooting stars** — random animated meteors.
- **Star trails** — long-exposure astrophotography simulation.

### Exploration & Discovery

- **Tonight's Best** — AI-computed personalized recommendations based on user location, time, altitude, magnitude, and Moon interference.
- **Sky Events Calendar** — 10 annual meteor showers with ZHR data, planet conjunctions, eclipses, solstices/equinoxes.
- **Telescope Mode** — 70+ deep-sky objects with simulated eyepiece view, adjustable magnification and aperture.
- **Deep Space Network Live** — Real-time simulation of NASA's 3 DSN complexes (Goldstone, Canberra, Madrid) communicating with 12 active spacecraft (Voyager 1 & 2, JWST, Mars Perseverance, Europa Clipper, Parker Solar Probe, etc.) with animated signal beams, data rates, and light-hour distances.
- **NASA APOD** — Daily Astronomy Picture of the Day from NASA's API.
- **Live Observatory Cameras** — 20+ real-time feeds from observatories worldwide.

### Interactive Tools

- **Light Pollution Simulator** — Bortle 1-9 slider showing real-time visual impact on star visibility, from 7,500 naked-eye stars (pristine) to ~100 (inner city). Overlay effect renders on top of the actual sky view.
- **AR Camera Mode** — Augmented reality overlay using WebRTC camera feed with DeviceOrientation for sky alignment.
- **Astrophotography Planner** — Tonight's conditions rating, 7-day darkness forecast, optimal DSO windows, Moon interference calculator.
- **Astro Weather** — Real-time stargazing score (0-100) using Open-Meteo API: cloud cover, humidity, visibility, wind, Moon phase with hour-by-hour forecast.
- **Multi-Location Compare** — Split-screen side-by-side sky view from two different locations.
- **Share This Sky** — Generates unique URL encoding location + timestamp for exact sky reproduction.
- **Event Notifications** — ISS pass predictions, meteor shower alerts, eclipse countdowns with push notifications via Notification API.
- **Screenshot** — Canvas capture to PNG.

### Search

- **Multilingual search** across planets (all 8 languages), 110+ Messier/NGC objects, stars (by proper name, Bayer designation, HIP number), and 48 constellations. Real-time planet positions via `Astronomy.Equator()`.

### Education

- **AstroQuiz** — Duolingo-style gamified quiz with 50+ questions across 5 categories, XP/level system, streak tracking.
- **Constellation Narrator** — Audio mythology narratives for each constellation.
- **Interactive Tutorial** — 6-section onboarding guide.
- **Quick Start** — Curated "Try This!" suggestions for new users.

### Accessibility

- Screen reader mode
- High contrast mode
- 4 color-blind modes (deuteranopia, protanopia, tritanopia, normal)
- Font scaling
- Reduced motion
- Keyboard shortcuts (15+ bindings)

### Internationalization

Full support for 8 languages: English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese.

---

## Technical Highlights

- **Zero backend** — All computation runs client-side (astronomy-engine, satellite.js, Three.js).
- **Adaptive performance** — GPU detection on load; mobile devices get reduced geometry (64 vs 128 segments), smaller textures (1024 vs 2048px), fewer stars (30K vs 95K), bloom disabled.
- **Proper WebGL lifecycle** — `renderer.forceContextLoss()` on cleanup prevents memory leaks across feature transitions.
- **Custom GLSL shaders** — Star glow, Milky Way procedural texture, aurora vertex animation, atmospheric scattering.
- **Real orbital mechanics** — SGP4 propagation for satellites, Kepler elements for asteroids, JPL-grade planetary ephemeris.
- **Progressive loading** — Star catalog and constellation data loaded asynchronously with progress indicator.
- **PWA** — Installable, offline-capable, responsive from 320px mobile to 4K desktop.

---

## Metrics

| Metric | Value |
|--------|-------|
| Components | 62 React components |
| Star catalog | 100,000+ stars (HYG v3, mag ≤ 6.5) |
| Deep-sky objects | 110+ Messier + NGC/IC |
| Satellites tracked | 30+ (expandable to 8,000+) |
| Near-Earth asteroids | 10 real NEOs |
| Exoplanets | 21 across 9 star systems |
| Spacecraft (DSN) | 12 active missions |
| Languages | 8 |
| Observatory cameras | 20+ live feeds |
| Quiz questions | 50+ |
| Lines of code | ~15,000+ (JSX/JS) |

---

## What Makes It Unique

1. **No other web app combines**: real-time sky rendering, 3D globe observatories, satellite tracking, asteroid tracking, exoplanet exploration, AND NASA DSN visualization — all in one platform, all free, all client-side.

2. **Scientific accuracy** — Every calculation uses real astronomical algorithms, not approximations. Star positions from the HYG catalog, planet positions from JPL ephemeris, satellite orbits from NORAD TLEs, lunar libration from IAU models.

3. **Light Pollution Simulator** — The only planetarium app with an interactive Bortle-scale overlay showing real-time visibility impact on the actual rendered sky.

4. **Deep Space Network Live** — No consumer app shows NASA's DSN communications with active spacecraft in real time.

5. **Exoplanet visualization in sky context** — Most exoplanet tools are standalone; this one integrates with the star field so users see alien worlds around the actual stars they're looking at.
