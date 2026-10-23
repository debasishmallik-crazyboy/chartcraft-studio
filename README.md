# ChartCraft Studio 🚀
> **Open-Source Animated Chart Generator for Video Editors with Broadcast Alpha Transparency**  
> *ভিডিও এডিটরদের জন্য অ্যানিমেটেড গ্রাফ তৈরির ওপেন সোর্স স্টুডিও — ফিল্মোরা, প্রিমিয়ার প্রো ও ক্যাপকাটে সরাসরি ট্রান্সপারেন্ট ওভারলে।*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Web & Node.js](https://img.shields.io/badge/Platform-Web%20%7C%20Node.js-10B981.svg)](https://nodejs.org/)
[![NLE: Filmora • Premiere • CapCut](https://img.shields.io/badge/NLE-Filmora%20%7C%20Premiere%20%7C%20CapCut%20%7C%20DaVinci-8B5CF6.svg)](#nle-import-guide)
[![Fonts: Bengali & English](https://img.shields.io/badge/Fonts-Bengali%20Google%20Fonts%20Supported-F59E0B.svg)](#-bengali-font-support)
[![Hosting: GitHub Pages Ready](https://img.shields.io/badge/Hosting-GitHub%20Pages%20%26%20InfinityFree-38BDF8.svg)](#-free-online-hosting)

---

## 💡 Why ChartCraft Studio? (কেন এই প্রজেক্ট?)

When video creators and editors add animated statistical graphs to their videos in **Wondershare Filmora**, **Adobe Premiere Pro**, **CapCut**, or **DaVinci Resolve**, they face painful friction:
- **Cloud Lag & Black Screens:** Built-in chart tools in video editors frequently freeze or fail due to remote webview timeouts.
- **Fixed Timelines:** Traditional tools lock animation to rigid 3-second durations with no timeline adjustability.
- **Keying Artifacts:** Green-screen keying often results in green halo fringes and blurry text edges.

**ChartCraft Studio** solves this completely:
1. **100% Alpha Transparency:** Export true **Apple ProRes 4444 (`.mov`)** or **Alpha WebM** with straight alpha channels, plus **Transparent PNG Sequences (`.zip`)**. Drop them directly above your video track with zero keying!
2. **Universal Dual-Mode:** Runs **100% client-side** on static web hosts (**GitHub Pages**, **InfinityFree**, Netlify, Vercel) using in-browser rendering (`JSZip` + `MediaRecorder`), AND features a **local Node.js + FFmpeg daemon** for hardware-accelerated ProRes 4444.
3. **Bengali Font Integration:** Full native support for top Google Bengali web fonts (**Noto Sans Bengali**, **Hind Siliguri**, **Tiro Bangla**, **Anek Bangla**, **Galada**, **Mina**) plus authentic Bengali numerals (`১২৩`).
4. **Smart CSV Auto-Fit:** Upload any CSV file — the studio analyzes the data shape and automatically selects the optimal chart variation, with full manual override.
5. **Mobile & Laptop Responsive:** Polished dark glassmorphic UI with dedicated mobile tab navigation, touch-friendly scrubbers, and fingertip `+` / `−` font size steppers.

---

## 📊 10 Animated Chart Variations

| Chart Type | Name | Best Used For | Auto-Fit Trigger |
| :--- | :--- | :--- | :--- |
| 📊 `bar` | **Column Bar** | Categorical comparisons (up to 6 items) | Default categorical data |
| 📶 `h_bar` | **Horizontal Bar** | Ranked metrics with many categories (>6 items) | Dense category counts |
| 👬 `grouped_bar` | **Grouped Bar** | Side-by-side comparison of 2 distinct series | Datasets with `Value 2` column |
| 🥞 `stacked_bar` | **Stacked Bar** | Cumulative segment contributions & totals | Part-to-whole segment comparisons |
| 📈 `line` | **Smooth Line** | Continuous trends and time-series | Sequential keywords (Jan-Dec, বৈশাখ-চৈত্র, Q1-Q4) |
| 🌊 `area` | **Gradient Area** | Dynamic volume and smooth waves | Timeline trends with visual emphasis |
| 🍩 `donut` | **Donut Chart** | Proportions & percentages with center metric | 3 to 5 categories summing to ~100% |
| 🥧 `pie` | **Classic Pie** | Full circle market share wedges | Proportional distribution metrics |
| 🎯 `radial` | **Radial Rings** | Concentric circular progress HUD | Multi-target percentage metrics |
| 🏁 `race` | **Bar Chart Race** | Animated dynamic ranking over periods | Multi-period historical rankings |

---

## 🔤 Bengali Font Support (বাংলা ফন্ট সাপোর্ট)

ChartCraft integrates Google Fonts for high-aesthetic Bengali motion graphics:
- **Noto Sans Bengali (নূটো সান্স বাংলা):** Modern, ultra-clean UI & YouTube documentary font.
- **Hind Siliguri (হিন্দ শিলিগুড়ি):** Highly legible editorial standard for news and explainers.
- **Tiro Bangla (তিরো বাংলা):** Classical, prestigious literary serif font.
- **Anek Bangla (অনেক বাংলা):** Versatile, high-contrast dynamic font.
- **Galada (গলদা):** Stylized cursive display font for festive and energetic videos.
- **Mina (মীনা):** Contemporary geometric modern Bengali.
- **বাংলা সংখ্যা (Bengali Numerals):** 1-click toggle converts numbers across all values, axes, and legends into Bengali digits (`০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯`).
- **Font Size Steppers:** Touch-friendly `−` and `+` precision buttons next to every slider for Title, Values, Axis Labels, and Legends.
- **X-Axis Rotation:** 0° Horizontal, 45° Slanted, or 90° Vertical orientation prevents text collision on dense datasets.

---

## 🎬 NLE Video Editor Import Guide

### 1. Wondershare Filmora 14 / 15
- **Method A (Recommended):** Drag the downloaded `*_prores4444.mov` or `*_alpha.webm` directly into the Filmora Media Library and drop it onto **Track 2** (above your background footage). It renders with 100% alpha transparency — zero background, zero green fringe.
- **Method B (PNG Sequence):** Go to `Import Media` $\to$ select `frame_0001.png` inside the unzipped frames folder $\to$ check the **"Image Sequence"** checkbox. Filmora loads it as a single video clip.

### 2. Adobe Premiere Pro & DaVinci Resolve
- Drag either the `*_prores4444.mov` or the unzipped PNG sequence directly onto your sequence above the background track. Straight alpha transparency is recognized automatically.

### 3. CapCut (PC & Mobile)
- **CapCut PC:** Import the unzipped PNG frames sequence directly onto the upper video track.
- **CapCut Mobile:** Export the **Chroma Green Screen Video** from ChartCraft Studio. In CapCut mobile, add the clip as an **Overlay** $\to$ tap **Cutout** $\to$ tap **Chroma Key** $\to$ select green $\to$ adjust intensity to 100%. Instant clean cutout on smartphones!

### 4. Adobe After Effects / EffectCraft
- Import `*_prores4444.mov` or the PNG image sequence as a composition layer with Straight Alpha.

---

## 🌐 Free Online Hosting (GitHub Pages / InfinityFree)

You can host ChartCraft Studio **100% for free** without paying for any VPS or Node.js server!

### Option A: GitHub Pages (Automated via GitHub Actions)
1. Fork or push this repository to GitHub.
2. In your repository settings: `Settings > Pages > Build and deployment > Source: GitHub Actions`.
3. The included [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) will automatically build and publish the app!
4. Visit `https://<your-username>.github.io/<repo-name>/`.
5. Users can export **Transparent PNG Sequences (.ZIP)**, **Alpha WebM Videos**, **Green Screen Videos**, and **Single Frame PNG Snapshots** entirely inside their browser!

### Option B: Free Web Hosting (InfinityFree, cPanel, 000webhost)
1. Register a free account on [InfinityFree](https://www.infinityfree.com/) (e.g. `yourname.free.nf`).
2. Open the Online File Manager or connect via FileZilla FTP.
3. Upload all files from the `public/` directory directly into your `htdocs/` folder.
4. Open your free domain in any browser — ChartCraft Studio runs instantly with client-side exports enabled!

---

## 💻 Local Power-User Setup (Node.js & FFmpeg)

For hardware-accelerated **Apple ProRes 4444 (`.mov`)** rendering:

1. Ensure **Node.js** (v18+) and **FFmpeg** (v5+) are installed:
   ```powershell
   node -v
   ffmpeg -version
   ```

2. Clone and start:
   ```powershell
   git clone https://github.com/your-username/chartcraft-studio.git
   cd chartcraft-studio
   node server.js
   ```

3. Open your browser at **[http://localhost:3456](http://localhost:3456)**.

---

## 📁 Repository Structure

```
chartcraft-studio/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated GitHub Pages CI/CD workflow
├── integrations/
│   ├── import_aftereffects.jsx   # Adobe After Effects ExtendScript bridge
│   └── import_filmcraft.py       # FilmCraft Python bridge
├── public/
│   ├── index.html                # Responsive Studio Web UI
│   ├── style.css                 # Glassmorphic responsive stylesheet
│   ├── chart_engine.js           # Deterministic 1920x1080 canvas chart engine (10 types)
│   ├── app.js                    # Controller, CSV parser & dual-mode export engine
│   └── jszip.min.js              # Bundled client-side ZIP generator (offline capable)
├── exports/                      # Default local render output directory
├── AI_HANDOVER_AND_ARCHITECTURE.md # Deep technical architecture dossier
├── CONTRIBUTING.md               # Open source contribution guide
├── LICENSE                       # MIT License
├── README.md                     # Comprehensive documentation (this file)
├── index.html                    # Root web redirect for static host roots
├── package.json                  # Project metadata
└── server.js                     # Lightweight Node.js & FFmpeg rendering daemon
```

---

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting pull requests.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
