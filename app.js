/**
 * ChartCraft Studio Application Controller
 * Handles 10 Chart Variations, Bengali & Google Fonts, Granular Font Steppers,
 * CSV Ingestion (UTF-8, Bengali numerals, and month detection), Mobile & Laptop Responsiveness,
 * and Universal Dual-Mode Video/PNG Exports (GitHub Pages / InfinityFree + Local Node Daemon).
 */

(function () {
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');

  // Offscreen rendering canvas for full-resolution exports (1920x1080)
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 1920;
  exportCanvas.height = 1080;
  const exportCtx = exportCanvas.getContext('2d');

  // Default State (for 1-Click Reset)
  const defaultState = {
    name: 'Quarterly_Revenue_Growth',
    type: 'bar',
    duration: 5.0,
    fps: 60,
    easing: 'easeOutCubic',
    transparent: true,
    bgMode: 'transparent', // 'transparent', 'chromaGreen', 'chromaBlue', 'dark'
    tiltX: 0,
    tiltY: 0,
    dropShadow: true,
    palette: 'neonCyber',
    fontFamily: "'Noto Sans Bengali', sans-serif",
    bengaliNumerals: false,
    title: '2026 Monthly Revenue',
    subtitle: 'Internal Performance Metrics (USD Millions)',
    valPrefix: '$',
    valSuffix: 'M',
    titleSize: 36,
    valSize: 22,
    axisSize: 18,
    legendSize: 18,
    labelRotation: 0, // 0, 45, 90 deg
    currentFrame: 300,
    isPlaying: false,
    data: [
      { label: 'Jan', value: 120, value2: 85, color: '#00F5D4' },
      { label: 'Feb', value: 195, value2: 130, color: '#7B2CBF' },
      { label: 'Mar', value: 310, value2: 210, color: '#F72585' },
      { label: 'Apr', value: 250, value2: 175, color: '#4CC9F0' },
      { label: 'May', value: 420, value2: 310, color: '#FFB703' },
      { label: 'Jun', value: 580, value2: 440, color: '#FB8500' }
    ]
  };

  // Active Application State
  let state = JSON.parse(JSON.stringify(defaultState));
  let animFrameId = null;
  let isServerAvailable = false;
  let lastProjectDir = '';

  const TYPE_NAMES = {
    bar: 'Column Bar',
    h_bar: 'Horizontal Bar',
    grouped_bar: 'Grouped Bar',
    stacked_bar: 'Stacked Bar',
    line: 'Smooth Line',
    area: 'Gradient Area',
    donut: 'Donut Chart',
    pie: 'Classic Pie',
    radial: 'Radial Rings',
    race: 'Bar Chart Race'
  };

  const BENGALI_NUMERAL_MAP = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };

  function parseBengaliOrEnglishNumber(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const clean = String(str).replace(/[০-৯]/g, d => BENGALI_NUMERAL_MAP[d] || d);
    return parseFloat(clean.replace(/[^0-9.\-]/g, '')) || 0;
  }

  // --- INITIALIZATION ---
  async function init() {
    setupEventListeners();
    setupMobileTabs();
    setupSteppers();
    renderDataTable();
    updateTimelineLimits();
    drawCurrentFrame();
    await checkServerStatus();

    // Redraw canvas once Google Fonts are loaded in the browser
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        drawCurrentFrame();
      });
    }
  }

  function setServerMode() {
    isServerAvailable = true;
    const badge = document.getElementById('hostModeBadge');
    if (badge) {
      badge.textContent = '⚡ SERVER MODE';
      badge.style.borderColor = 'rgba(59, 130, 246, 0.4)';
      badge.style.color = '#38BDF8';
    }
    const proresStatus = document.getElementById('badgeProresStatus');
    if (proresStatus) proresStatus.textContent = 'Ready (FFmpeg)';
  }

  function setWebHostingMode() {
    isServerAvailable = false;
    const badge = document.getElementById('hostModeBadge');
    if (badge) {
      badge.textContent = '🌐 WEB HOSTING';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      badge.style.color = '#10B981';
    }
    const proresStatus = document.getElementById('badgeProresStatus');
    if (proresStatus) proresStatus.textContent = 'Requires Local Node';
    const descProres = document.getElementById('descProres');
    if (descProres) {
      descProres.textContent = 'Run "node server.js" locally for hardware ProRes 4444 encoding. On web hosting, download the Transparent PNG Sequence (.ZIP) or Alpha WebM above!';
    }
  }

  // --- CHECK SERVER STATUS (DUAL-MODE) ---
  async function checkServerStatus() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      setWebHostingMode();
      return;
    }
    try {
      const res = await fetch('/api/projects', { method: 'GET' });
      if (res.ok) {
        setServerMode();
      } else {
        setWebHostingMode();
      }
    } catch (e) {
      setWebHostingMode();
    }
  }

  // --- MOBILE TABS NAVIGATION ---
  function setupMobileTabs() {
    const tabs = document.querySelectorAll('.mobile-tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tabKey = btn.dataset.tab;
        document.body.setAttribute('data-active-tab', tabKey);
      });
    });
    // Default tab for mobile
    document.body.setAttribute('data-active-tab', 'preview');
  }

  // --- STEPPER BUTTONS (+ and -) ---
  function setupSteppers() {
    document.querySelectorAll('.btn-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const step = parseFloat(btn.dataset.step);
        const input = document.getElementById(targetId);
        if (!input) return;

        let curVal = parseFloat(input.value);
        let newVal = curVal + step;

        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        if (!isNaN(min)) newVal = Math.max(min, newVal);
        if (!isNaN(max)) newVal = Math.min(max, newVal);

        input.value = newVal;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // 10 Chart Type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setChartType(btn.dataset.type);
      });
    });

    // Best-Fit Auto Detect Buttons
    const autoFitHdr = document.getElementById('btnAutoFitHeader');
    if (autoFitHdr) autoFitHdr.addEventListener('click', runAutoFitDetection);

    const autoFitSide = document.getElementById('btnAutoFitSidebar');
    if (autoFitSide) autoFitSide.addEventListener('click', runAutoFitDetection);

    // Inputs
    document.getElementById('projectName').addEventListener('input', e => state.name = e.target.value);
    document.getElementById('inpTitle').addEventListener('input', e => { state.title = e.target.value; drawCurrentFrame(); });
    document.getElementById('inpSubtitle').addEventListener('input', e => { state.subtitle = e.target.value; drawCurrentFrame(); });
    document.getElementById('inpPrefix').addEventListener('input', e => { state.valPrefix = e.target.value; drawCurrentFrame(); });
    document.getElementById('inpSuffix').addEventListener('input', e => { state.valSuffix = e.target.value; drawCurrentFrame(); });

    // Font Family Selector
    const selFont = document.getElementById('selFontFamily');
    if (selFont) {
      selFont.addEventListener('change', e => {
        state.fontFamily = e.target.value;
        const fontName = e.target.options[e.target.selectedIndex].text.split('(')[0].trim();
        const badgeFont = document.getElementById('badgeCurrentFont');
        if (badgeFont) badgeFont.textContent = fontName;
        drawCurrentFrame();
      });
    }

    // Bengali Digits Toggle
    const chkBengali = document.getElementById('chkBengaliDigits');
    if (chkBengali) {
      chkBengali.addEventListener('change', e => {
        state.bengaliNumerals = e.target.checked;
        drawCurrentFrame();
      });
    }

    // Background Mode Selector (Transparent, Chroma Green, Chroma Blue, Dark)
    const selBg = document.getElementById('selBgMode');
    if (selBg) {
      selBg.addEventListener('change', e => {
        state.bgMode = e.target.value;
        state.transparent = (state.bgMode === 'transparent');
        
        const alphaBadge = document.getElementById('badgeAlpha');
        if (alphaBadge) {
          if (state.bgMode === 'transparent') {
            alphaBadge.textContent = 'ALPHA TRANSPARENT';
            alphaBadge.className = 'badge-accent';
          } else if (state.bgMode === 'chromaGreen') {
            alphaBadge.textContent = 'CHROMA GREEN (KEYING)';
            alphaBadge.className = 'badge-recommend';
          } else if (state.bgMode === 'chromaBlue') {
            alphaBadge.textContent = 'CHROMA BLUE';
            alphaBadge.className = 'badge-accent';
          } else {
            alphaBadge.textContent = 'DARK STAGE';
            alphaBadge.className = 'badge';
          }
        }
        drawCurrentFrame();
      });
    }

    // Typography Sizing Sliders
    const inpTitleSize = document.getElementById('inpTitleSize');
    if (inpTitleSize) {
      inpTitleSize.addEventListener('input', e => {
        state.titleSize = parseInt(e.target.value);
        document.getElementById('lblTitleSize').textContent = `${state.titleSize}px`;
        drawCurrentFrame();
      });
    }

    const inpValSize = document.getElementById('inpValSize');
    if (inpValSize) {
      inpValSize.addEventListener('input', e => {
        state.valSize = parseInt(e.target.value);
        document.getElementById('lblValSize').textContent = `${state.valSize}px`;
        drawCurrentFrame();
      });
    }

    const inpAxisSize = document.getElementById('inpAxisSize');
    if (inpAxisSize) {
      inpAxisSize.addEventListener('input', e => {
        state.axisSize = parseInt(e.target.value);
        document.getElementById('lblAxisSize').textContent = `${state.axisSize}px`;
        drawCurrentFrame();
      });
    }

    const inpLegendSize = document.getElementById('inpLegendSize');
    if (inpLegendSize) {
      inpLegendSize.addEventListener('input', e => {
        state.legendSize = parseInt(e.target.value);
        document.getElementById('lblLegendSize').textContent = `${state.legendSize}px`;
        drawCurrentFrame();
      });
    }

    // Label Rotation Buttons (0, 45, 90 deg)
    document.querySelectorAll('.rot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rot-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.labelRotation = parseInt(btn.dataset.rot);
        drawCurrentFrame();
      });
    });

    // Duration slider
    const inpDuration = document.getElementById('inpDuration');
    inpDuration.addEventListener('input', e => {
      state.duration = parseFloat(e.target.value);
      document.getElementById('lblDuration').textContent = `${state.duration.toFixed(1)}s`;
      updateTimelineLimits();
      drawCurrentFrame();
    });

    // FPS
    document.getElementById('selFps').addEventListener('change', e => {
      state.fps = parseInt(e.target.value);
      updateTimelineLimits();
      drawCurrentFrame();
    });

    // Easing
    document.getElementById('selEasing').addEventListener('change', e => {
      state.easing = e.target.value;
      drawCurrentFrame();
    });

    // 3D Tilt Controls
    document.getElementById('inpTiltX').addEventListener('input', e => {
      state.tiltX = parseInt(e.target.value);
      document.getElementById('lblTiltX').textContent = state.tiltX;
      drawCurrentFrame();
    });

    document.getElementById('inpTiltY').addEventListener('input', e => {
      state.tiltY = parseInt(e.target.value);
      document.getElementById('lblTiltY').textContent = state.tiltY;
      drawCurrentFrame();
    });

    // Drop Shadow
    document.getElementById('chkShadow').addEventListener('change', e => {
      state.dropShadow = e.target.checked;
      drawCurrentFrame();
    });

    // Palette
    document.getElementById('selPalette').addEventListener('change', e => {
      state.palette = e.target.value;
      assignPaletteColors();
      renderDataTable();
      drawCurrentFrame();
    });

    // Scrubber
    const scrubber = document.getElementById('timelineScrubber');
    scrubber.addEventListener('input', e => {
      state.currentFrame = parseInt(e.target.value);
      updateTimeDisplay();
      drawCurrentFrame();
    });

    // Play / Pause
    document.getElementById('btnPlay').addEventListener('click', togglePlay);
    document.getElementById('btnRewind').addEventListener('click', () => {
      state.currentFrame = 0;
      scrubber.value = 0;
      updateTimeDisplay();
      drawCurrentFrame();
    });

    // Backdrop toggle (Checkerboard vs solid dark)
    document.getElementById('btnBgToggle').addEventListener('click', () => {
      const vp = document.getElementById('canvasViewport');
      vp.classList.toggle('checkerboard');
    });

    // 1-Click Reset to Default
    document.getElementById('btnResetAll').addEventListener('click', resetToDefault);

    // Data Table actions
    document.getElementById('btnAddRow').addEventListener('click', () => {
      state.data.push({ label: `আইটেম ${state.data.length + 1}`, value: 100, value2: 60, color: '#3B82F6' });
      renderDataTable();
      drawCurrentFrame();
    });

    document.getElementById('btnPresetData').addEventListener('click', loadRandomPreset);

    // CSV File Upload
    const csvInput = document.getElementById('csvFileInput');
    csvInput.addEventListener('change', handleCsvUpload);

    // Download Sample CSV (English & Bengali)
    document.getElementById('btnDownloadSampleCsv').addEventListener('click', downloadSampleCsv);
    document.getElementById('btnDownloadBengaliCsv').addEventListener('click', downloadBengaliSampleCsv);

    // Drag and Drop CSV onto Table
    const dropZone = document.getElementById('dropZoneContainer');
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.background = 'rgba(59, 130, 246, 0.1)'; });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.style.background = ''; });
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.style.background = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processCsvFile(e.dataTransfer.files[0]);
      }
    });

    // Primary Export Button (Opens Universal Modal)
    document.getElementById('btnExport').addEventListener('click', openExportModal);

    // Modal Trigger Buttons inside Universal Modal
    document.getElementById('btnTriggerZipDl').addEventListener('click', () => runZipExport());
    document.getElementById('btnTriggerSinglePngDl').addEventListener('click', () => runSinglePngExport());
    document.getElementById('btnTriggerWebmDl').addEventListener('click', () => runWebmExport(false));
    document.getElementById('btnTriggerGreenDl').addEventListener('click', () => runWebmExport(true));
    document.getElementById('btnTriggerMovDl').addEventListener('click', () => runProresMovExport());
    document.getElementById('btnTriggerJsonDl').addEventListener('click', () => runJsonExport());

    // Copy Path Button
    document.getElementById('btnCopyPath').addEventListener('click', () => {
      const input = document.getElementById('txtExportFolderPath');
      navigator.clipboard.writeText(input.value);
      const btn = document.getElementById('btnCopyPath');
      btn.textContent = 'Path Copied! ✓';
      btn.style.background = '#10B981';
      setTimeout(() => {
        btn.textContent = '📋 Copy Path';
        btn.style.background = '';
      }, 2000);
    });

    // Modal Close
    document.getElementById('btnCloseModal').addEventListener('click', () => {
      document.getElementById('exportModal').classList.remove('active');
    });
    document.getElementById('btnCloseExportModal').addEventListener('click', () => {
      document.getElementById('exportModal').classList.remove('active');
    });

    // Projects Modal
    document.getElementById('btnProjectsModal').addEventListener('click', openProjectsModal);
    document.getElementById('btnCloseProjects').addEventListener('click', () => {
      document.getElementById('projectsModal').classList.remove('active');
    });
  }

  function setChartType(typeKey) {
    state.type = typeKey;
    document.querySelectorAll('.type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === typeKey);
    });
    const typeBadge = document.getElementById('badgeCurrentType');
    if (typeBadge) typeBadge.textContent = TYPE_NAMES[typeKey] || typeKey;
    drawCurrentFrame();
  }

  // --- SMART BEST-FIT CHART DETECTION ---
  function autoDetectBestChart(data, headers = []) {
    if (!data || !data.length) return { type: 'bar', reason: 'Default bar' };

    // Rule 1: Multi-series data (has value2 populated) -> Grouped Bar
    const hasValue2 = data.some(d => d.value2 !== undefined && d.value2 !== null && d.value2 > 0);
    if (hasValue2) {
      return { type: 'grouped_bar', reason: 'Multi-series comparisons look best as Grouped Bar' };
    }

    // Rule 2: Sequential time-series keywords (English & Bengali months, quarters, years)
    const labels = data.map(d => String(d.label).toLowerCase());
    const timeKeywords = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
      'q1', 'q2', 'q3', 'q4', '2020', '2021', '2022', '2023', '2024', '2025', '2026', 'day', 'week', 'month', 'year',
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
      'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
    ];
    const isSequential = labels.some(l => timeKeywords.some(k => l.includes(k)));
    if (isSequential) {
      return { type: 'line', reason: 'Sequential timeline metrics look cleanest as a Smooth Line curve' };
    }

    // Rule 3: Few items (3-5) and values look like proportional shares -> Donut
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    const looksPercentage = (total >= 90 && total <= 110) || (data.length <= 5 && data.length >= 3);
    if (looksPercentage) {
      return { type: 'donut', reason: 'Part-to-whole proportions look most engaging as Donut Chart' };
    }

    // Rule 4: Many categories (> 6 items) -> Horizontal Bar (avoids label crowding)
    if (data.length > 6) {
      return { type: 'h_bar', reason: 'Ranked comparisons with many items fit best as Horizontal Bar' };
    }

    // Default: Column Bar
    return { type: 'bar', reason: 'Standard categorical metrics look great as Column Bar' };
  }

  function runAutoFitDetection() {
    const result = autoDetectBestChart(state.data);
    setChartType(result.type);

    const recBadge = document.getElementById('badgeRecommend');
    if (recBadge) {
      recBadge.style.display = 'inline-block';
      recBadge.textContent = `✨ Best Fit: ${TYPE_NAMES[result.type]}`;
      setTimeout(() => { recBadge.style.display = 'none'; }, 4000);
    }
  }

  // --- 1-CLICK RESET TO DEFAULT ---
  function resetToDefault() {
    state = JSON.parse(JSON.stringify(defaultState));

    // Update UI Elements
    document.getElementById('projectName').value = state.name;
    document.getElementById('inpTitle').value = state.title;
    document.getElementById('inpSubtitle').value = state.subtitle;
    document.getElementById('inpPrefix').value = state.valPrefix;
    document.getElementById('inpSuffix').value = state.valSuffix;

    document.getElementById('inpDuration').value = state.duration;
    document.getElementById('lblDuration').textContent = `${state.duration.toFixed(1)}s`;
    document.getElementById('selFps').value = state.fps;
    document.getElementById('selEasing').value = state.easing;

    document.getElementById('selFontFamily').value = state.fontFamily;
    document.getElementById('chkBengaliDigits').checked = state.bengaliNumerals;
    document.getElementById('selBgMode').value = state.bgMode;

    document.getElementById('inpTiltX').value = state.tiltX;
    document.getElementById('lblTiltX').textContent = state.tiltX;
    document.getElementById('inpTiltY').value = state.tiltY;
    document.getElementById('lblTiltY').textContent = state.tiltY;
    document.getElementById('chkShadow').checked = state.dropShadow;
    document.getElementById('selPalette').value = state.palette;

    document.getElementById('inpTitleSize').value = state.titleSize;
    document.getElementById('lblTitleSize').textContent = `${state.titleSize}px`;
    document.getElementById('inpValSize').value = state.valSize;
    document.getElementById('lblValSize').textContent = `${state.valSize}px`;
    document.getElementById('inpAxisSize').value = state.axisSize;
    document.getElementById('lblAxisSize').textContent = `${state.axisSize}px`;
    document.getElementById('inpLegendSize').value = state.legendSize;
    document.getElementById('lblLegendSize').textContent = `${state.legendSize}px`;

    document.querySelectorAll('.rot-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rot === '0');
    });

    setChartType('bar');
    assignPaletteColors();
    renderDataTable();
    updateTimelineLimits();
    drawCurrentFrame();
  }

  // --- CSV FILE INGESTION (UTF-8, BENGALI NUMERAL & DELIMITER TOLERANT) ---
  function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (file) processCsvFile(file);
    e.target.value = '';
  }

  function processCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      // Decode arrayBuffer with UTF-8 to preserve Bengali script
      const buffer = event.target.result;
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      parseAndApplyCsvText(text);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseAndApplyCsvText(csvText) {
    // Strip BOM if present
    const cleanCsv = csvText.replace(/^\uFEFF/, '').trim();
    const lines = cleanCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      alert('CSV must contain at least a header and one data row.');
      return;
    }

    // Auto-detect delimiter: comma, semicolon, or tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    if (firstLine.includes('\t') && !firstLine.includes(',')) delimiter = '\t';

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const palette = ChartEngine.Palettes[state.palette] || ChartEngine.Palettes.neonCyber;
    const newData = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        const label = parts[0] || `Item ${i}`;
        const val1 = parseBengaliOrEnglishNumber(parts[1]);
        const val2 = parts[2] !== undefined && parts[2] !== '' ? parseBengaliOrEnglishNumber(parts[2]) : undefined;
        const color = parts[3] && parts[3].startsWith('#') ? parts[3] : palette[(i - 1) % palette.length];

        newData.push({
          label,
          value: val1,
          value2: val2,
          color
        });
      }
    }

    if (newData.length > 0) {
      state.data = newData;

      // Automatically select best fit chart!
      const fitResult = autoDetectBestChart(newData, headers);
      setChartType(fitResult.type);

      const recBadge = document.getElementById('badgeRecommend');
      if (recBadge) {
        recBadge.style.display = 'inline-block';
        recBadge.textContent = `✨ Auto-fit: ${TYPE_NAMES[fitResult.type]}`;
        setTimeout(() => { recBadge.style.display = 'none'; }, 4000);
      }

      renderDataTable();
      drawCurrentFrame();
    }
  }

  function downloadSampleCsv() {
    const csvContent = "Category,Value_1,Value_2\nJan,120,80\nFeb,195,140\nMar,310,210\nApr,250,190\nMay,420,330\nJun,580,450\n";
    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), 'sample_chart_data.csv');
  }

  function downloadBengaliSampleCsv() {
    const bom = '\uFEFF';
    const csvContent = bom + "মাস,আয়_২০২৫,আয়_২০২৬\nজানুয়ারি,১২০,৮৫\nফেব্রুয়ারি,১৯৫,১৩০\nমার্চ,৩১০,২১০\nএপ্রিল,২৫০,১৭৫\nমে,৪২০,৩১০\nজুন,৫৮০,৪৪০\n";
    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), 'sample_bengali_chart_data.csv');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // --- DRAWING & TIMELINE ---
  function getTotalFrames() {
    return Math.round(state.duration * state.fps);
  }

  function updateTimelineLimits() {
    const total = getTotalFrames();
    const scrubber = document.getElementById('timelineScrubber');
    scrubber.max = total;
    if (state.currentFrame > total) state.currentFrame = total;
    scrubber.value = state.currentFrame;
    updateTimeDisplay();
  }

  function updateTimeDisplay() {
    const curSec = (state.currentFrame / state.fps).toFixed(2);
    const totalSec = state.duration.toFixed(2);
    document.getElementById('timeCurrent').textContent = `${curSec.padStart(5, '0')}s`;
    document.getElementById('timeTotal').textContent = `${totalSec.padStart(5, '0')}s`;
  }

  function drawCurrentFrame() {
    const total = getTotalFrames();
    ChartEngine.renderFrame(ctx, canvas.width, canvas.height, state.currentFrame, total, state);
  }

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    const btn = document.getElementById('btnPlay');
    if (state.isPlaying) {
      btn.textContent = '⏸';
      if (state.currentFrame >= getTotalFrames()) state.currentFrame = 0;
      playLoop();
    } else {
      btn.textContent = '▶';
      if (animFrameId) cancelAnimationFrame(animFrameId);
    }
  }

  function playLoop() {
    if (!state.isPlaying) return;
    const total = getTotalFrames();
    state.currentFrame += 1;
    if (state.currentFrame > total) {
      state.currentFrame = total;
      togglePlay();
      return;
    }
    document.getElementById('timelineScrubber').value = state.currentFrame;
    updateTimeDisplay();
    drawCurrentFrame();
    animFrameId = requestAnimationFrame(playLoop);
  }

  // --- DATA SPREADSHEET TABLE ---
  function renderDataTable() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';

    state.data.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const val2Display = row.value2 !== undefined ? row.value2 : '';
      tr.innerHTML = `
        <td><input type="text" value="${escapeHtml(row.label)}" data-idx="${idx}" class="tbl-label" placeholder="Category"></td>
        <td><input type="number" value="${row.value}" data-idx="${idx}" class="tbl-val" placeholder="Value 1"></td>
        <td><input type="number" value="${val2Display}" data-idx="${idx}" class="tbl-val2" placeholder="Val 2 (optional)"></td>
        <td><input type="color" value="${row.color || '#3B82F6'}" data-idx="${idx}" class="tbl-color"></td>
        <td><button class="btn-del" data-idx="${idx}" title="Delete">🗑</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.tbl-label').forEach(inp => {
      inp.addEventListener('input', e => {
        state.data[parseInt(e.target.dataset.idx)].label = e.target.value;
        drawCurrentFrame();
      });
    });

    tbody.querySelectorAll('.tbl-val').forEach(inp => {
      inp.addEventListener('input', e => {
        state.data[parseInt(e.target.dataset.idx)].value = parseFloat(e.target.value) || 0;
        drawCurrentFrame();
      });
    });

    tbody.querySelectorAll('.tbl-val2').forEach(inp => {
      inp.addEventListener('input', e => {
        const val = e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0);
        state.data[parseInt(e.target.dataset.idx)].value2 = val;
        drawCurrentFrame();
      });
    });

    tbody.querySelectorAll('.tbl-color').forEach(inp => {
      inp.addEventListener('input', e => {
        state.data[parseInt(e.target.dataset.idx)].color = e.target.value;
        drawCurrentFrame();
      });
    });

    tbody.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx);
        state.data.splice(idx, 1);
        renderDataTable();
        drawCurrentFrame();
      });
    });
  }

  function assignPaletteColors() {
    const palette = ChartEngine.Palettes[state.palette] || ChartEngine.Palettes.neonCyber;
    state.data.forEach((d, i) => {
      d.color = palette[i % palette.length];
    });
  }

  function loadRandomPreset() {
    const presets = [
      {
        title: 'ত্রৈমাসিক আয় বৃদ্ধি',
        subtitle: 'গ্লোবাল অপারেশন পারফরম্যান্স (২০২৫ বনাম ২০২৬)',
        data: [
          { label: 'Q1', value: 340, value2: 280, color: '#006A4E' },
          { label: 'Q2', value: 480, value2: 390, color: '#F42A41' },
          { label: 'Q3', value: 620, value2: 510, color: '#FF9933' },
          { label: 'Q4', value: 890, value2: 720, color: '#138808' }
        ]
      },
      {
        title: 'স্মার্টফোন ব্র্যান্ড শেয়ার',
        subtitle: 'বাজার বিশ্লেষণ ২০২৬ (শতাংশ)',
        data: [
          { label: 'Apple', value: 32, color: '#3A86FF' },
          { label: 'Samsung', value: 28, color: '#00B4D8' },
          { label: 'Xiaomi', value: 18, color: '#FB8500' },
          { label: 'Vivo', value: 12, color: '#00F5D4' },
          { label: 'Others', value: 10, color: '#7B2CBF' }
        ]
      },
      {
        title: 'ইউটিউব ভিডিও ভিউস',
        subtitle: 'গত ৬ মাসের অ্যানালিটিক্স রিপোর্ট',
        data: [
          { label: 'জানুয়ারি', value: 450, color: '#FF6B6B' },
          { label: 'ফেব্রুয়ারি', value: 580, color: '#FF9F43' },
          { label: 'মার্চ', value: 720, color: '#FECA57' },
          { label: 'এপ্রিল', value: 690, color: '#54A0FF' },
          { label: 'মে', value: 880, color: '#5F27CD' },
          { label: 'জুন', value: 1150, color: '#10AC84' }
        ]
      }
    ];

    const pick = presets[Math.floor(Math.random() * presets.length)];
    state.title = pick.title;
    state.subtitle = pick.subtitle;
    state.data = pick.data;

    document.getElementById('inpTitle').value = state.title;
    document.getElementById('inpSubtitle').value = state.subtitle;

    const fit = autoDetectBestChart(state.data);
    setChartType(fit.type);
    renderDataTable();
    drawCurrentFrame();
  }

  // --- UNIVERSAL EXPORT MODAL & CLIENT-SIDE + SERVER EXPORTS ---
  function openExportModal() {
    saveProjectToLocal(state);
    const modal = document.getElementById('exportModal');
    const modalFooter = document.getElementById('exportModalFooter');
    const successCard = document.getElementById('exportSuccessCard');
    const progressBox = document.getElementById('exportProgressBox');

    modal.classList.add('active');
    modalFooter.style.display = 'none';
    successCard.style.display = 'flex'; // Show download cards immediately
    progressBox.style.display = 'none'; // Hide progress until user clicks an option
  }

  // 1. Export Transparent PNG Sequence ZIP (Client-Side JSZip)
  async function runZipExport() {
    const progressBox = document.getElementById('exportProgressBox');
    const statusText = document.getElementById('exportStatusText');
    const progressBar = document.getElementById('exportProgressBar');
    const frameCounter = document.getElementById('exportFrameCounter');
    const percentText = document.getElementById('exportPercent');

    progressBox.style.display = 'block';
    progressBar.style.width = '0%';
    percentText.textContent = '0%';
    statusText.textContent = 'Starting in-browser transparent PNG sequence export...';

    const totalFrames = getTotalFrames();
    const exportConfig = { ...state, width: 1920, height: 1080, totalFrames };

    try {
      if (typeof JSZip === 'undefined') throw new Error('JSZip library is loading. Please retry.');
      const zip = new JSZip();
      const framesFolder = zip.folder('frames');

      for (let f = 0; f <= totalFrames; f++) {
        ChartEngine.renderFrame(exportCtx, 1920, 1080, f, totalFrames, exportConfig);
        const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/png'));
        const pad = String(f + 1).padStart(4, '0');
        framesFolder.file(`frame_${pad}.png`, blob);

        const pct = Math.round((f / totalFrames) * 65);
        progressBar.style.width = `${pct}%`;
        percentText.textContent = `${pct}%`;
        frameCounter.textContent = `Frame ${f} / ${totalFrames}`;

        if (f % 5 === 0) await new Promise(r => setTimeout(r, 1));
      }

      zip.file('project.chart.json', JSON.stringify(exportConfig, null, 2));
      zip.file('README.txt', getReadmeGuide(state.name, 1920, 1080, state.fps));

      statusText.textContent = 'Building ZIP bundle in memory...';
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, metadata => {
        const pct = 65 + Math.round((metadata.percent || 0) * 0.35);
        progressBar.style.width = `${pct}%`;
        percentText.textContent = `${pct}%`;
      });

      progressBar.style.width = '100%';
      percentText.textContent = '100%';
      statusText.textContent = '✅ ZIP Download Initiated!';
      downloadBlob(zipBlob, `${state.name}_frames.zip`);
    } catch (err) {
      statusText.textContent = `❌ Error: ${err.message}`;
    }
  }

  // 2. Export Single High-Res Transparent PNG Snapshot
  function runSinglePngExport() {
    ChartEngine.renderFrame(exportCtx, 1920, 1080, state.currentFrame, getTotalFrames(), state);
    exportCanvas.toBlob(blob => {
      downloadBlob(blob, `${state.name}_frame_${state.currentFrame}.png`);
    }, 'image/png');
  }

  // 3. Export WebM Video (Alpha or Chroma Green)
  async function runWebmExport(isGreenScreen = false) {
    const progressBox = document.getElementById('exportProgressBox');
    const statusText = document.getElementById('exportStatusText');
    const progressBar = document.getElementById('exportProgressBar');
    const percentText = document.getElementById('exportPercent');
    const frameCounter = document.getElementById('exportFrameCounter');

    progressBox.style.display = 'block';
    progressBar.style.width = '0%';
    percentText.textContent = '0%';
    statusText.textContent = isGreenScreen ? 'Recording Chroma Green Video (CapCut Compatible)...' : 'Recording Alpha Transparent Video (.webm)...';

    const totalFrames = getTotalFrames();
    const exportConfig = {
      ...state,
      width: 1920,
      height: 1080,
      totalFrames,
      bgMode: isGreenScreen ? 'chromaGreen' : state.bgMode
    };

    try {
      const stream = exportCanvas.captureStream(state.fps);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      const donePromise = new Promise(resolve => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      recorder.start();

      for (let f = 0; f <= totalFrames; f++) {
        ChartEngine.renderFrame(exportCtx, 1920, 1080, f, totalFrames, exportConfig);
        const pct = Math.round((f / totalFrames) * 90);
        progressBar.style.width = `${pct}%`;
        percentText.textContent = `${pct}%`;
        frameCounter.textContent = `Frame ${f} / ${totalFrames}`;
        await new Promise(r => setTimeout(r, 1000 / state.fps));
      }

      recorder.stop();
      const videoBlob = await donePromise;

      progressBar.style.width = '100%';
      percentText.textContent = '100%';
      statusText.textContent = '✅ Video Download Initiated!';
      const filename = isGreenScreen ? `${state.name}_chromagreen.webm` : `${state.name}_alpha.webm`;
      downloadBlob(videoBlob, filename);
    } catch (err) {
      statusText.textContent = `❌ Error: ${err.message}`;
    }
  }

  // 4. Export QuickTime Transparent MOV (.MOV) — Dual-Mode (Local Server or In-Browser)
  async function runProresMovExport() {
    const progressBox = document.getElementById('exportProgressBox');
    const statusText = document.getElementById('exportStatusText');
    const progressBar = document.getElementById('exportProgressBar');
    const frameCounter = document.getElementById('exportFrameCounter');
    const percentText = document.getElementById('exportPercent');

    progressBox.style.display = 'block';
    progressBar.style.width = '0%';
    percentText.textContent = '0%';

    const totalFrames = getTotalFrames();
    const exportConfig = { ...state, width: 1920, height: 1080, totalFrames, bgMode: 'transparent' };

    // MODE A: LOCAL NODE SERVER RUNNING (Hardware ProRes 4444 via FFmpeg)
    if (isServerAvailable) {
      statusText.textContent = 'Initializing local FFmpeg render session...';

      try {
        const startRes = await fetch('/api/render-session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exportConfig)
        });
        const startData = await startRes.json();
        if (startData.success) {
          const sessionId = startData.sessionId;
          lastProjectDir = startData.projectDir;
          statusText.textContent = 'Streaming frames to local ProRes 4444 encoder...';

          for (let f = 0; f <= totalFrames; f++) {
            ChartEngine.renderFrame(exportCtx, 1920, 1080, f, totalFrames, exportConfig);
            const imgData = exportCtx.getImageData(0, 0, 1920, 1080);
            const rawBytes = new Uint8Array(imgData.data.buffer);

            const chunkRes = await fetch('/api/render-session/chunk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
                'X-Session-Id': sessionId,
                'X-Frame-Index': f.toString()
              },
              body: rawBytes
            });
            if (!chunkRes.ok) throw new Error(`Error uploading frame ${f}`);

            const pct = Math.round((f / totalFrames) * 100);
            progressBar.style.width = `${pct}%`;
            percentText.textContent = `${pct}%`;
            frameCounter.textContent = `Frame ${f} / ${totalFrames}`;

            if (f % 5 === 0) await new Promise(r => setTimeout(r, 1));
          }

          statusText.textContent = 'Finalizing Apple ProRes 4444 (.mov) file...';
          const finishRes = await fetch('/api/render-session/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          const finishData = await finishRes.json();

          if (finishData.success) {
            statusText.textContent = '🎉 ProRes 4444 Video Rendered Successfully!';
            progressBar.style.width = '100%';
            const boxPath = document.getElementById('boxServerPath');
            if (boxPath) {
              boxPath.style.display = 'flex';
              document.getElementById('txtExportFolderPath').value = finishData.projectDir;
            }
            window.location.href = finishData.movUrl;
            return;
          }
        }
      } catch (err) {
        console.warn('Local server render failed, switching to in-browser MOV export:', err);
      }
    }

    // MODE B: 100% IN-BROWSER QUICKTIME MOV EXPORT (For GitHub Pages & InfinityFree)
    try {
      statusText.textContent = 'Rendering 1080p frames for QuickTime .MOV with Alpha...';
      const pngBuffers = [];

      for (let f = 0; f <= totalFrames; f++) {
        ChartEngine.renderFrame(exportCtx, 1920, 1080, f, totalFrames, exportConfig);

        const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/png'));
        const arrayBuf = await blob.arrayBuffer();
        pngBuffers.push(new Uint8Array(arrayBuf));

        const pct = Math.round((f / totalFrames) * 85);
        progressBar.style.width = `${pct}%`;
        percentText.textContent = `${pct}%`;
        frameCounter.textContent = `Frame ${f} / ${totalFrames}`;

        if (f % 5 === 0) await new Promise(r => setTimeout(r, 1));
      }

      statusText.textContent = 'Muxing 32-bit QuickTime .MOV with Alpha in browser...';
      progressBar.style.width = '90%';
      percentText.textContent = '90%';
      await new Promise(r => setTimeout(r, 20));

      const fps = state.fps || 60;
      const movBytes = QuickTimeMovBuilder.createQuickTimeMov(pngBuffers, 1920, 1080, fps);
      const movBlob = new Blob([movBytes], { type: 'video/quicktime' });

      progressBar.style.width = '100%';
      percentText.textContent = '100%';
      statusText.textContent = '🎉 Transparent QuickTime .MOV Downloaded Successfully!';

      const dlUrl = URL.createObjectURL(movBlob);
      const a = document.createElement('a');
      a.href = dlUrl;
      const sanitizedTitle = (state.title || 'chart').trim().replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_');
      a.download = `${sanitizedTitle}_transparent.mov`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(dlUrl), 30000);

    } catch (err) {
      statusText.textContent = `❌ Error exporting MOV: ${err.message}`;
      console.error(err);
    }
  }

  // 5. Export Project JSON
  function runJsonExport() {
    const jsonStr = JSON.stringify(state, null, 2);
    downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `${state.name}.chart.json`);
  }

  function getReadmeGuide(name, w, h, fps) {
    return `# ChartCraft Export: ${name}
Generated: ${new Date().toLocaleString()}
Resolution: ${w}x${h} @ ${fps} FPS

## How to Import into Video Editors:
1. Wondershare Filmora 14/15:
   - Import Media -> Select "frame_0001.png" -> Check "Image Sequence" -> Drag to Track 2.
   - Or drag the generated .MOV or .WEBM directly onto upper timeline track. 100% transparent.

2. Adobe Premiere Pro & DaVinci Resolve:
   - Drag the .MOV, .WEBM or import Image Sequence into your timeline directly.

3. CapCut (PC & Mobile):
   - Import the PNG frames sequence or import the Green Screen video and use "Chroma Key" (1 tap).

4. Adobe After Effects / EffectCraft:
   - Import image sequence as Straight Alpha layer.
`;
  }

  function saveProjectToLocal(config) {
    try {
      const stored = JSON.parse(localStorage.getItem('chartcraft_saved_projects') || '[]');
      const filtered = stored.filter(p => (p.config && p.config.name !== config.name));
      filtered.unshift({
        folderName: config.name,
        config: JSON.parse(JSON.stringify(config)),
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem('chartcraft_saved_projects', JSON.stringify(filtered.slice(0, 30)));
    } catch (e) {}
  }

  function loadProjectState(config) {
    Object.assign(state, config);
    document.getElementById('projectName').value = state.name;
    document.getElementById('inpTitle').value = state.title;
    document.getElementById('inpSubtitle').value = state.subtitle || '';
    document.getElementById('inpDuration').value = state.duration;
    document.getElementById('lblDuration').textContent = `${state.duration.toFixed(1)}s`;
    document.getElementById('selFps').value = state.fps;
    document.getElementById('selPalette').value = state.palette;
    if (state.fontFamily) document.getElementById('selFontFamily').value = state.fontFamily;
    if (state.bgMode) document.getElementById('selBgMode').value = state.bgMode;
    if (state.bengaliNumerals !== undefined) document.getElementById('chkBengaliDigits').checked = state.bengaliNumerals;

    if (state.titleSize) {
      document.getElementById('inpTitleSize').value = state.titleSize;
      document.getElementById('lblTitleSize').textContent = `${state.titleSize}px`;
    }
    if (state.valSize) {
      document.getElementById('inpValSize').value = state.valSize;
      document.getElementById('lblValSize').textContent = `${state.valSize}px`;
    }
    if (state.axisSize) {
      document.getElementById('inpAxisSize').value = state.axisSize;
      document.getElementById('lblAxisSize').textContent = `${state.axisSize}px`;
    }
    if (state.legendSize) {
      document.getElementById('inpLegendSize').value = state.legendSize;
      document.getElementById('lblLegendSize').textContent = `${state.legendSize}px`;
    }

    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === state.type);
    });
    document.getElementById('badgeCurrentType').textContent = TYPE_NAMES[state.type] || state.type;
    renderDataTable();
    updateTimelineLimits();
    drawCurrentFrame();
  }

  // --- PROJECTS LIST ---
  async function openProjectsModal() {
    const modal = document.getElementById('projectsModal');
    const container = document.getElementById('projectsList');
    container.innerHTML = '<p>Loading saved projects...</p>';
    modal.classList.add('active');

    let projects = [];

    // If local server is available, fetch from server API
    if (isServerAvailable) {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          if (data && data.projects) projects = data.projects;
        }
      } catch (err) {}
    }

    // Always merge or fallback to localStorage projects (essential for web hosting)
    try {
      const stored = localStorage.getItem('chartcraft_saved_projects');
      if (stored) {
        const localList = JSON.parse(stored);
        if (localList && localList.length) {
          if (!projects.length) {
            projects = localList;
          } else {
            // merge unique by name
            const names = new Set(projects.map(p => p.config ? p.config.name : p.folderName));
            localList.forEach(lp => {
              const n = lp.config ? lp.config.name : lp.folderName;
              if (!names.has(n)) projects.push(lp);
            });
          }
        }
      }
    } catch (e) {}

    if (!projects.length) {
      container.innerHTML = '<p style="color: var(--text-muted); grid-column: span 2;">No past projects found yet. Any chart you edit or export is automatically saved!</p>';
      return;
    }

    container.innerHTML = '';
    projects.forEach(p => {
      const cfg = p.config || p;
      const title = cfg.title || p.folderName || 'Untitled Chart';
      const item = document.createElement('div');
      item.className = 'project-item';
      item.innerHTML = `
        <div class="project-title">${escapeHtml(title)}</div>
        <div class="project-meta">Type: ${TYPE_NAMES[cfg.type] || cfg.type} • ${cfg.duration}s @ ${cfg.fps || 60} FPS</div>
        <div class="project-meta" style="margin-top: 4px; color: #3B82F6;">Click to Reload & Re-edit</div>
      `;
      item.addEventListener('click', () => {
        loadProjectState(cfg);
        modal.classList.remove('active');
      });
      container.appendChild(item);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Run on start
  init();
})();
