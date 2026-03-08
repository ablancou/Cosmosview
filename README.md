# 🌌 CosmosView — Real-Time Personal Planetarium

A stunning web application that renders the real night sky in 3D using your current location and local time. Functions as a personal planetarium in the browser — zero installation, zero backend, zero paid APIs.

![CosmosView Screenshot](screenshots/placeholder.png)

## ✨ Features

- **Real-time sky simulation** — accurate star positions updated every 10 seconds
- **200+ cataloged stars** (expandable to 9,000+ with full HYG dataset)
- **48 IAU constellation patterns** with animated line drawing and translated names
- **Real planet positions** — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn via [astronomy-engine](https://github.com/cosinekitty/astronomy)
- **Procedural Milky Way** — GLSL shader-based galactic band
- **Atmospheric glow** — dynamic sunset/sunrise colors based on real Sun altitude
- **3 responsive layouts** — desktop, portrait mobile, landscape mobile
- **8 languages** — EN, ES, IT, PT, FR, DE, JA, ZH
- **Dark & Light mode** with system preference detection
- **Interactive controls** — time scrubber ±24h, layer toggles, city selector, star search
- **Star details** — click any star for name, constellation, magnitude, spectral type, distance
- **Coordinate grids** — equatorial (RA/Dec) and horizontal (Alt/Az)
- **Cardinal directions** — N/S/E/W labels at the horizon
- **GPU-adaptive performance** — automatically reduces star count on low-end devices
- **Pure static site** — deployable to Vercel/Netlify with zero configuration

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/cosmosview.git
cd cosmosview

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Build for Production

```bash
npm run build
npm run preview  # Preview the production build locally
```

## 🌟 Replacing Sample Star Data with Full HYG v3

The included `public/hyg_v3_mag65.json` contains a representative sample of **200 stars**. To use the complete HYG v3 catalog (~9,000 stars at magnitude ≤ 6.5):

1. **Download** the HYG Database v3 CSV from: [HYG Database on GitHub](https://github.com/astronexus/HYG-Database)
2. **Filter** to magnitude < 6.5:
   ```python
   import csv, json
   
   stars = []
   with open('hygdata_v35.csv', 'r') as f:
       reader = csv.DictReader(f)
       for i, row in enumerate(reader):
           mag = float(row['mag']) if row['mag'] else 99
           if mag <= 6.5:
               stars.append({
                   "id": i,
                   "proper": row.get('proper', ''),
                   "bayer": row.get('bayer', ''),
                   "con": row.get('con', ''),
                   "ra": float(row['ra']) if row['ra'] else 0,
                   "dec": float(row['dec']) if row['dec'] else 0,
                   "mag": mag,
                   "spect": row.get('spect', ''),
                   "dist": float(row['dist']) if row['dist'] else 0,
                   "ci": float(row['ci']) if row['ci'] else 0
               })
   
   with open('hyg_v3_mag65.json', 'w') as f:
       json.dump(stars, f)
   ```
3. **Replace** `public/hyg_v3_mag65.json` with the generated file.

## 🔧 Technology Stack

| Technology | Purpose | License |
|---|---|---|
| React 18 | UI framework | MIT |
| Three.js | 3D rendering | MIT |
| Vite | Build tool | MIT |
| Tailwind CSS v4 | Styling | MIT |
| Zustand | State management | MIT |
| astronomy-engine | Astronomical calculations | MIT |
| i18next | Internationalization | MIT |
| HYG Database v3 | Star catalog | CC BY-SA 4.0 |

## 🌍 Supported Languages

- 🇬🇧 English (default)
- 🇪🇸 Español
- 🇮🇹 Italiano
- 🇧🇷 Português
- 🇫🇷 Français
- 🇩🇪 Deutsch
- 🇯🇵 日本語
- 🇨🇳 中文

## 📁 Project Structure

```
cosmosview/
├── public/
│   ├── hyg_v3_mag65.json        # Star catalog (200 sample stars)
│   └── constellations_iau.json  # IAU constellation line data
├── src/
│   ├── components/              # React components (3D + UI)
│   ├── hooks/                   # Custom React hooks
│   ├── locales/                 # i18n translation files (8 langs)
│   ├── shaders/                 # GLSL vertex/fragment shaders
│   ├── store/                   # Zustand state management
│   ├── utils/                   # Coordinate transforms, colors, cities
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # Entry point
│   ├── i18n.js                  # i18next configuration
│   └── index.css                # Tailwind + custom styles
├── index.html
├── vite.config.js
└── package.json
```

## 📜 Attribution

- **Star Data**: [HYG Database v3](https://github.com/astronexus/HYG-Database) by David Nash — CC BY-SA 4.0
- **Astronomical Engine**: [astronomy-engine](https://github.com/cosinekitty/astronomy) by Don Cross — MIT License
- **Constellation Data**: Based on IAU constellation boundaries and traditional asterisms
- **Fonts**: Inter, Cormorant Garamond, Noto Sans JP, Noto Sans SC — all under OFL/Apache 2.0

## 🚢 Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the `dist/` folder to Netlify
```

### GitHub Pages
```bash
# Add to vite.config.js: base: '/cosmosview/'
npm run build
# Deploy dist/ folder
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

Original code © 2026. Star data used under CC BY-SA 4.0.
