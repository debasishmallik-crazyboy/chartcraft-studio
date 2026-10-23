# Contributing to ChartCraft Studio 🚀

Thank you for your interest in contributing to **ChartCraft Studio**! We welcome bug reports, new chart types, motion graphics enhancements, and translation improvements.

---

## 🛠️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/chartcraft-studio.git
   cd chartcraft-studio
   ```

2. **Run locally:**
   - **Static Mode:** You can open `public/index.html` directly in any web browser, or serve it with any static server (`npx serve public` or VS Code Live Server).
   - **Full ProRes 4444 Daemon Mode:**
     Ensure you have [FFmpeg](https://ffmpeg.org/) installed and available in your PATH:
     ```bash
     node server.js
     ```
     Open `http://localhost:3456`.

---

## 🎨 Guidelines for Adding New Chart Types

ChartCraft uses a deterministic canvas rendering engine in `public/chart_engine.js`.
When adding a new chart type:
1. Register the chart key in `public/index.html` and `public/app.js` (`TYPE_NAMES`).
2. Implement your drawing function in `public/chart_engine.js`:
   ```javascript
   function drawMyChart(ctx, width, height, progress, config) { ... }
   ```
3. Ensure you use `getFont(config, weight, size)` and `formatValue(val, config)` for all text and numbers to maintain Bengali font and numeral support.
4. Ensure the canvas background is completely cleared with `ctx.clearRect` for alpha transparency.

---

## 📝 Pull Request Checklist
- [ ] Code follows vanilla JS conventions (zero heavy bundler dependencies).
- [ ] Responsive design verified on mobile (<= 768px) and desktop (>= 1024px).
- [ ] Bengali Google Fonts (Noto Sans Bengali, Hind Siliguri, Tiro Bangla, etc.) render cleanly.
- [ ] Client-side export (PNG Sequence ZIP, WebM, Snapshot) functions without server.
- [ ] License remains MIT.
