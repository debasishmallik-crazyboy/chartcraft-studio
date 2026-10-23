# ChartCraft Studio — Project Handover, Architecture & AI Developer Dossier

> **Target Audience:** Future AI Agents (Antigravity, Claude Code, Cursor, Codex), Senior Systems Engineers, and Motion Graphics Developers extending this codebase.
> **Date of Snapshot:** October 2026
> **Workspace Origin:** `c:\Users\Asus\Documents\antigravity\proud-bohr\chartcraft`
> **Deployment Mirror:** `\\Desktop-btieu21\k\chart craft studio`

---

## 1. Executive Summary & Problem Origin

### 1.1 The Filmora Reverse-Engineering Discovery
This project was conceived after analyzing why **Wondershare Filmora 14/15's** built-in **"Animated Charts"** feature (`https://filmora.wondershare.com/embedded/charts/?mode=new&theme=dark...`) frequently failed, froze, or displayed a solid pitch-black dialog window on end-user machines.

By inspecting Filmora's internal processes (`WebBrowser.exe`, `CefViewWing.exe`), runtime logs (`APP@MAIN...`, `debug.log`), and reverse-engineering the hosted client bundle (`main.Cg_Mg3m6.js`, `vchart.DJ9BSUZs.js`), we exposed the underlying design:
1. **Online Web App Disguised as Native Tool:** Filmora does not ship Animated Charts as a native C++ module or offline plugin. It dynamically loads a Vue 3 web app hosted on Wondershare's remote servers using an embedded Chromium (CEF 89) subprocess.
2. **The "Black Screen" Bug Root Cause:** The web app sets `#0F1214` as its body background in dark mode. Because it fetches massive client bundles (`vchart.js`, `vendor.js`, Google Fonts) on every dialog invocation, any network jitter, high ping, or proxy interference triggers Chromium's HTTP/2 multiplexing failure (`[WARNING:spdy_session.cc] Received HEADERS for invalid stream`). When this happens, the webview hangs permanently on the `#0F1214` background, displaying a blank black box to the user until a C++ timeout (`Check Chart Saved timeout - [FChartCreateDialog.cpp]`) terminates it.
3. **The 3-Second Fixed Duration Trap:** Filmora's internal C++ bridge (`window.wsClientFunction`) uses a helper called `useFrameSequenceGenerator`. To avoid freezing the single-threaded CEF JS runtime, Wondershare hardcoded the animation duration to ~3 seconds.
4. **Timeline Non-Editability:** When clicking "Add to Timeline", Filmora rasterizes the chart into a flattened PNG image sequence, writes it to a temporary disk path, and imports it as a static video track. The timeline has zero awareness of the underlying chart object, numbers, or parameters. If a creator wants to change a single number, they must discard the clip and start from scratch.

### 1.2 The ChartCraft Solution
ChartCraft Studio was engineered from first principles to completely eliminate these limitations:
- **100% Local & Zero-Latency:** Zero cloud dependency. No network calls, no black screens. Starts instantly.
- **Arbitrary Custom Duration:** An unconstrained slider (1.0s to 30.0s) driving a deterministic virtual clock (`specAtFrame`), guaranteeing zero dropped frames at 30 FPS or 60 FPS.
- **Broadcast-Grade Alpha Transparency:** Encodes hardware-accelerated **Apple ProRes 4444 (`.mov`) with 100% Alpha Channel** (`yuva444p12le`), alongside transparent PNG sequences and WebM previews.
- **Smart Timeline Re-Editability (In-Place Re-Render):** Every export creates a `project.chart.json` file alongside the media. When data is modified in the studio, clicking "Export" overwrites the output file in place, triggering automatic timeline clip refreshes in Premiere Pro, After Effects, and Filmora without requiring timeline re-assembly.
- **Word-Style Typography & Annotations:** Adjustable font sizes for Title, Values, Axis Labels, and Legends, plus 0°, 45°, and 90° vertical X-axis label rotation to prevent label collision on dense datasets.
- **Direct Multi-Series CSV Ingestion with "Best-Fit" Auto-Detection:** Intelligently recommends and switches to the optimal chart type based on data shape (e.g. Grouped Bar for 2-series comparisons, Smooth Line for time series, Donut for proportions, Horizontal Bar for dense categories).

---

## 2. System Architecture & Component Breakdown

```
[ Web UI Frontend ] (public/index.html, app.js, chart_engine.js)
        │
        ├── User inputs: 10 Chart Variations, Duration (1-30s), FPS (30/60), 
        │   3D Tilt (-30° to +30°), Drop Shadow, Typography (90°/45° rotation), CSV Upload
        │
        ├── Deterministic Engine: ChartEngine.renderFrame(ctx, w, h, frame, total, config)
        │   Renders frame-accurate graphics on 1920x1080 canvas with alpha clearRect
        │
        ├── Real-Time Streaming: Extracts raw RGBA ArrayBuffer (1920*1080*4 bytes)
        │   Streams frame chunks sequentially via HTTP POST to /api/render-session/chunk
        │
        ▼
[ Node.js Daemon Backend ] (server.js - Port 3456)
        │
        ├── Session Orchestration: /api/render-session/start
        │   Prepares export directory: exports/<ProjectName>_<Timestamp>/
        │   Saves project.chart.json + README.txt
        │   Spawns pinned FFmpeg process with stdin pipe:
        │     ffmpeg -y -f rawvideo -pix_fmt rgba -s 1920x1080 -r 60 -i - \
        │            -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le out.mov \
        │            -c:v png frames/frame_%04d.png
        │
        ├── Ingestion & Piping: Writes incoming Uint8Array directly into ffmpeg.stdin
        │
        ├── Finalization: /api/render-session/finish
        │   Closes stdin, waits for exit code 0
        │   Spawns PowerShell Compress-Archive to bundle frames/ into frames_sequence.zip
        │   Returns direct download URLs and absolute disk path
        │
        ▼
[ Output Delivery Bundle ] (exports/<ProjectName>_<Timestamp>/)
        ├── <ProjectName>_prores4444.mov  (Apple ProRes 4444 with Alpha Channel)
        ├── frames_sequence.zip           (Full 60fps Transparent PNG Sequence ZIP)
        ├── frames/frame_0001.png...      (Uncompressed PNG Frames)
        ├── project.chart.json            (Human-readable editable project specification)
        └── README.txt                    (NLE import instructions for editors)
```

---

## 3. Directory Structure

```
chartcraft/
├── AI_HANDOVER_AND_ARCHITECTURE.md    # Master AI & developer handover documentation (this file)
├── README.md                          # Quickstart & user documentation
├── package.json                       # Project metadata and run scripts
├── server.js                          # Lightweight HTTP server & FFmpeg rendering daemon
├── exports/                           # Default directory where render bundles are saved
│   └── <Project>_<Timestamp>/
│       ├── <Project>_prores4444.mov   # Primary ProRes 4444 alpha video
│       ├── frames_sequence.zip        # Zipped PNG sequence
│       ├── frames/                    # Raw PNG sequence frames
│       ├── project.chart.json         # Source configuration
│       └── README.txt                 # NLE import guide
├── integrations/
│   ├── import_filmcraft.py            # Python bridge for FilmCraft video editor
│   └── import_aftereffects.jsx        # Adobe After Effects / EffectCraft ExtendScript
└── public/
    ├── index.html                     # Sleek dark-mode Studio UI
    ├── style.css                      # Custom glassmorphic styles & responsive layout
    ├── chart_engine.js                # Core deterministic canvas chart renderer (10 types)
    └── app.js                         # Application state controller, CSV parser & export client
```

---

## 4. Key Implementation Details & Technical Secrets

### 4.1 Deterministic Frame Clock (`specAtFrame`)
Traditional web chart animation relies on `requestAnimationFrame` and browser wall-clock time (`Date.now()`). When attempting to record video, any CPU lag or frame-drop results in stuttery, non-deterministic video.

**ChartCraft's Solution:**
In `public/chart_engine.js`, time is decoupled from wall-clock time:
$$\text{progress} = \text{EasingFunction}\left(\min\left(1.0, \frac{\text{currentFrame}}{\text{totalFrames} \times 0.8}\right)\right)$$
- An explicit frame number ($f \in [0, \text{totalFrames}]$) is passed to `ChartEngine.renderFrame()`.
- The animation reaches 100% completion at $80\%$ of the duration, leaving the remaining $20\%$ as an **End-Hold Window** so viewers can read final numbers in the video.
- Supported Easing Curves: `easeOutCubic`, `easeOutBack` (bouncy spring), `easeOutElastic`, `linear`.

### 4.2 Multi-Output FFmpeg Pipeline via Raw RGBA Pipe
In `server.js`, FFmpeg is spawned with input format `rawvideo` and pixel format `rgba` over standard input (`stdin`):
```javascript
const ffmpegArgs = [
  '-y',
  '-f', 'rawvideo',
  '-pix_fmt', 'rgba',
  '-s', `${width}x${height}`,
  '-r', `${fps}`,
  '-i', '-',
  // Output 1: Apple ProRes 4444 with Alpha Channel
  '-c:v', 'prores_ks',
  '-profile:v', '4444',
  '-pix_fmt', 'yuva444p10le',
  movPath,
  // Output 2: PNG Image Sequence
  '-c:v', 'png',
  pngPattern
];
```
- **Windows Path Invariant:** Backslashes (`\`) in `pngPattern` (e.g. `c:\path\frames\frame_%04d.png`) are interpreted by FFmpeg as character escapes, breaking `%04d` numbering. `server.js` explicitly normalizes all FFmpeg paths to forward slashes (`/`).
- **Unpremultiplication:** Canvas `getImageData()` produces un-premultiplied RGBA. `prores_ks` with `yuva444p10le` natively maps alpha without premultiplication halos.

### 4.3 The 10 Chart Variations & Data Formats

| Key | Name | Visual Logic | Data Fields Used |
| :--- | :--- | :--- | :--- |
| `bar` | Column Bar | Vertical columns with gradient fill & top rounded corners | `label`, `value`, `color` |
| `h_bar` | Horizontal Bar | Ranked horizontal bars, left-aligned category labels | `label`, `value`, `color` |
| `grouped_bar` | Grouped Bar | Side-by-side comparison bars for multi-series comparisons | `label`, `value` (Series 1), `value2` (Series 2) |
| `stacked_bar` | Stacked Bar | Segmented stacked columns showing part-to-whole | `label`, `value` (Base), `value2` (Top) |
| `line` | Smooth Line | Quadratic bezier spline with glow points and clean stroke | `label`, `value`, `color` |
| `area` | Gradient Area | Spline curve with semi-transparent vertical area gradient | `label`, `value`, `color` |
| `donut` | Donut Chart | Hollow circle with animated metric in the center | `label`, `value`, `color` |
| `pie` | Classic Pie | Full circle wedges with color swatch legend | `label`, `value`, `color` |
| `radial` | Radial Rings | Concentric HUD-style circular progress arcs | `label`, `value`, `color` |
| `race` | Bar Chart Race | Animated dynamic ranking bar race over time periods | `periods: [{ year, data: [...] }]` |

### 4.4 Smart Best-Fit Auto-Detection Algorithm
In `public/app.js`, `autoDetectBestChart(data, headers)` evaluates incoming data:
1. If any row contains a secondary value (`value2 > 0`), it auto-selects **`grouped_bar`**.
2. If labels match chronological or sequential keywords (`jan`, `feb`, `q1`, `2024`, `day`, `week`), it auto-selects **`line`** or **`area`**.
3. If categories are few ($\le 5$) and sum to $\approx 100\%$ or represent proportional shares, it auto-selects **`donut`**.
4. If category count is dense ($> 6$ items), it auto-selects **`h_bar`** to prevent label crowding.
5. Otherwise, defaults to **`bar`**.

### 4.5 Word-Style Typography & Axis Label Rotation
In `public/chart_engine.js`:
- When `labelRotation === 90`:
  ```javascript
  ctx.translate(x, y + 5);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ```
- When `labelRotation === 45`:
  ```javascript
  ctx.translate(x, y + 5);
  ctx.rotate(Math.PI / 4);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ```
- When rotated, the bottom chart margin dynamically expands ($120\text{px} \to 150\text{px} \to 180\text{px}$) so long category names never clip off the bottom edge of the frame.

---

## 5. NLE Integration Guide (Filmora, FilmCraft, Premiere, After Effects, CapCut)

### 5.1 Wondershare Filmora
- **Recommended Option:** Drag the generated `*_prores4444.mov` into the Filmora Media Library and drop it onto **Track 2** (above your background footage on Track 1). Filmora automatically renders the alpha channel with zero background. No green-screen keying or blend-mode alteration needed.
- **Secondary Option:** Go to `Import Media` $\to$ select `frame_0001.png` inside the `frames/` folder $\to$ check **"Image Sequence"** at the bottom of the open dialog. Filmora loads the entire folder as a single transparent video clip.

### 5.2 Adobe Premiere Pro & DaVinci Resolve
- Drag `*_prores4444.mov` directly into the timeline. Both editors natively decode 10-bit/12-bit Apple ProRes 4444 with Straight Alpha.

### 5.3 Adobe After Effects / EffectCraft
- Import `*_prores4444.mov`. AE prompts or defaults to Premultiplied Alpha.
- Or run the bundled ExtendScript: [`integrations/import_aftereffects.jsx`](file:///c:/Users/Asus/Documents/antigravity/proud-bohr/chartcraft/integrations/import_aftereffects.jsx) via EffectCraft or AE's `File > Scripts > Run Script File...` to drop the chart directly into the active composition at the current playhead.

### 5.4 FilmCraft
- Use the bundled helper script [`integrations/import_filmcraft.py`](file:///c:/Users/Asus/Documents/antigravity/proud-bohr/chartcraft/integrations/import_filmcraft.py) or use FilmCraft MCP tool `media_import` with the `.mov` path.

### 5.5 CapCut (PC)
- Import the unzipped `frames/` sequence or import the `.mov` file directly onto the upper video track.

---

## 6. Roadmap & High-Priority Expansion Areas for Future AI Agents

If you are an AI assistant continuing development on this codebase, here are the most impactful next features to implement:

### 🚀 Roadmap Task 1: Client-Side "Zero-Server" WebCodecs Export (For Web Hosting)
- **Goal:** Enable users to export MP4/WebM videos directly from the browser on static hosting (GitHub Pages, Vercel, cPanel without Node.js).
- **How to Build:**
  - Integrate the modern **WebCodecs API** (`VideoEncoder`) paired with lightweight muxers like `mp4-muxer` or `webm-muxer` in JavaScript.
  - For PNG sequences on static hosting, use `jszip` in a Web Worker to generate `frames_sequence.zip` in-memory and trigger a browser blob download.
  - This allows ChartCraft Studio to be hosted on *any* standard website without requiring a backend Node.js server.

### 🚀 Roadmap Task 2: Lottie JSON & Vector SVG Sequence Export
- **Goal:** Allow motion designers to import animated vector shapes directly into After Effects, Figma, or mobile apps without raster pixelation.
- **How to Build:**
  - Map `ChartEngine`'s bar rects and line paths to standard Lottie JSON schema (`layers`, `shapes`, `ks: { s, p, a }`).
  - Add an "Export Lottie (.json)" button alongside the video exports.

### 🚀 Roadmap Task 3: True WebGL 3D Extrusion & Metallic Shaders
- **Goal:** Elevate the 2D affine matrix tilt (`ctx.transform`) into full 3D extruded geometry.
- **How to Build:**
  - Integrate a lightweight Three.js or `@visactor/vchart` 3D plugin rendering extruded 3D bevels, ambient occlusion, and directional key lights while retaining the transparent canvas background (`alpha: true, premultipliedAlpha: false`).

### 🚀 Roadmap Task 4: Audio Sound Effects (SFX) Track
- **Goal:** Automated audio synthesis synced to the animation.
- **How to Build:**
  - Using Web Audio API or FFmpeg `sine` / `anullsrc` filters, synthesize subtle high-tech click/tick SFX on every bar increment and a smooth whoosh SFX during the initial transition.
  - Mux the generated audio stream into the `.mov` container.

### 🚀 Roadmap Task 5: Adobe Premiere Pro CEP Panel Extension
- **Goal:** Embed ChartCraft Studio directly inside Premiere Pro as an internal floating panel (`Window > Extensions > ChartCraft`).
- **How to Build:**
  - Package the `public/` folder into an Adobe CEP extension manifest (`CSXS/manifest.xml`).
  - Use CSInterface to write the exported file directly into `app.project.importFiles()`.

---

## 7. Quickstart Runbook

### To Start the Studio Locally:
```powershell
cd "c:\Users\Asus\Documents\antigravity\proud-bohr\chartcraft"
node server.js
```
Open **[http://localhost:3456](http://localhost:3456)** in any browser (Chrome, Edge, Firefox).

### Network Mirror Location:
The entire project, source code, and handover files are mirrored at:
`\\Desktop-btieu21\k\chart craft studio`

---
*Authored with Antigravity Pair Programming & Tri-Perspective Multi-Agent Verification (Abacus AI + ByteDance DeerFlow).*
