/**
 * ChartCraft Deterministic Rendering Engine
 * Renders frame-perfect animated charts with alpha transparency, 3D tilt,
 * 10 chart variations, custom font sizes & Word-style 90/45 degree axis label rotation.
 */

window.ChartEngine = (function () {
  // Bengali digits dictionary
  const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  function toBengaliNumerals(val) {
    if (val === null || val === undefined) return '';
    return String(val).replace(/\d/g, d => BENGALI_DIGITS[parseInt(d, 10)]);
  }

  function formatValue(num, config) {
    if (num === null || num === undefined) return '';
    const formatted = typeof num === 'number' ? num.toLocaleString() : String(num);
    return config && config.bengaliNumerals ? toBengaliNumerals(formatted) : formatted;
  }

  function getFont(config, weight = 'normal', size = 18) {
    const family = (config && config.fontFamily) || "'Plus Jakarta Sans', 'Noto Sans Bengali', sans-serif";
    return `${weight} ${size}px ${family}`;
  }

  // Easing functions
  const Easing = {
    linear: t => t,
    easeOutQuad: t => t * (2 - t),
    easeOutCubic: t => --t * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutBack: t => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutElastic: t => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    }
  };

  // Color palettes
  const Palettes = {
    neonCyber: ['#00F5D4', '#7B2CBF', '#F72585', '#4CC9F0', '#FFB703', '#FB8500', '#7209B7', '#3A0CA3'],
    techBlue: ['#3A86FF', '#00B4D8', '#48CAE4', '#90E0EF', '#0077B6', '#023E8A', '#03045E', '#0096C7'],
    vibrantOrange: ['#FF6B6B', '#FF9F43', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD', '#EE5253', '#10AC84'],
    emeraldLuxury: ['#10B981', '#059669', '#34D399', '#6EE7B7', '#047857', '#065F46', '#2DD4BF', '#0F766E'],
    goldSunset: ['#F59E0B', '#D97706', '#B45309', '#EF4444', '#EC4899', '#8B5CF6', '#F97316', '#DC2626'],
    minimalMono: ['#FFFFFF', '#E2E8F0', '#94A3B8', '#64748B', '#475569', '#334155', '#1E293B', '#CBD5E1'],
    bengaliHeritage: ['#006A4E', '#F42A41', '#FF9933', '#138808', '#000080', '#D62728', '#2CA02C', '#1F77B4']
  };

  /**
   * Main render function for an exact frame
   */
  function renderFrame(ctx, width, height, currentFrame, totalFrames, config) {
    // 1. Clear canvas completely for alpha transparency
    ctx.clearRect(0, 0, width, height);

    const bgMode = config.bgMode || (config.transparent ? 'transparent' : 'dark');
    if (bgMode === 'chromaGreen') {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, width, height);
    } else if (bgMode === 'chromaBlue') {
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(0, 0, width, height);
    } else if (bgMode === 'dark' || (!config.transparent && bgMode !== 'transparent')) {
      ctx.fillStyle = config.bgColor || '#0F1214';
      ctx.fillRect(0, 0, width, height);
    } // 'transparent' mode leaves canvas cleared with alpha 0

    // 2. Compute animation progress (0.0 to 1.0)
    const animFrames = Math.floor(totalFrames * (config.animPercent || 0.8));
    let rawProgress = Math.min(1.0, currentFrame / Math.max(1, animFrames));
    const easeFn = Easing[config.easing || 'easeOutCubic'] || Easing.easeOutCubic;
    const progress = easeFn(rawProgress);

    // 3. Setup Coordinate System & 3D Transformation
    ctx.save();

    const tiltX = (config.tiltX || 0) * (Math.PI / 180);
    const tiltY = (config.tiltY || 0) * (Math.PI / 180);

    const centerX = width / 2;
    const centerY = height / 2;

    ctx.translate(centerX, centerY);
    if (tiltX !== 0 || tiltY !== 0) {
      ctx.transform(
        Math.cos(tiltY),
        Math.sin(tiltX) * 0.4,
        -Math.sin(tiltY) * 0.3,
        Math.cos(tiltX),
        0, 0
      );
    }
    ctx.translate(-centerX, -centerY);

    // Apply Drop Shadow if enabled
    if (config.dropShadow) {
      ctx.shadowColor = config.shadowColor || 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = config.shadowBlur || 24;
      ctx.shadowOffsetX = config.shadowOffsetX || 8;
      ctx.shadowOffsetY = config.shadowOffsetY || 16;
    } else {
      ctx.shadowColor = 'transparent';
    }

    // 4. Render Chart Types (10 Variations)
    const chartType = config.type || 'bar';
    switch (chartType) {
      case 'bar':
        drawBarChart(ctx, width, height, progress, config);
        break;
      case 'h_bar':
        drawHorizontalBarChart(ctx, width, height, progress, config);
        break;
      case 'grouped_bar':
        drawGroupedBarChart(ctx, width, height, progress, config);
        break;
      case 'stacked_bar':
        drawStackedBarChart(ctx, width, height, progress, config);
        break;
      case 'line':
        drawLineChart(ctx, width, height, progress, config, false);
        break;
      case 'area':
        drawLineChart(ctx, width, height, progress, config, true);
        break;
      case 'donut':
      case 'pie':
        drawPieChart(ctx, width, height, progress, config, chartType === 'donut');
        break;
      case 'radial':
        drawRadialProgressChart(ctx, width, height, progress, config);
        break;
      case 'race':
        drawBarChartRace(ctx, width, height, rawProgress, config);
        break;
      default:
        drawBarChart(ctx, width, height, progress, config);
    }

    ctx.restore();

    // 5. Draw Title & Subtitle (Drawn crisp without 3D distortion)
    if (config.title) {
      ctx.save();
      const titleSize = config.titleSize || 36;
      ctx.font = getFont(config, 'bold', titleSize);
      ctx.fillStyle = config.titleColor || '#FFFFFF';
      ctx.textAlign = config.titleAlign || 'left';
      ctx.textBaseline = 'top';
      const titleX = config.titleAlign === 'center' ? width / 2 : 100;
      ctx.fillText(config.title, titleX, 60);

      if (config.subtitle) {
        const subSize = Math.max(14, Math.round(titleSize * 0.55));
        ctx.font = getFont(config, 'normal', subSize);
        ctx.fillStyle = config.subtitleColor || '#94A3B8';
        ctx.fillText(config.subtitle, titleX, 60 + titleSize + 8);
      }
      ctx.restore();
    }
  }
  }

  // --- 1. COLUMN BAR CHART ---
  function drawBarChart(ctx, width, height, progress, config) {
    const data = config.data || [];
    if (!data.length) return;

    const colors = Palettes[config.palette || 'neonCyber'];
    const margin = getChartMargins(config);
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 10) * 1.15;
    const barWidth = Math.min(100, (chartW / data.length) * 0.65);
    const step = chartW / data.length;

    drawGrid(ctx, margin.left, margin.top, chartW, chartH, maxVal, config);

    data.forEach((d, i) => {
      const x = margin.left + (i * step) + (step - barWidth) / 2;
      const targetH = (d.value / maxVal) * chartH;
      const currentH = targetH * progress;
      const y = margin.top + chartH - currentH;
      const color = d.color || colors[i % colors.length];

      const grad = ctx.createLinearGradient(x, y, x, y + currentH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, adjustColorBrightness(color, -25));
      ctx.fillStyle = grad;

      const radius = Math.min(12, barWidth / 2);
      drawRoundedRect(ctx, x, y, barWidth, currentH, radius, true, false);

      // Value label on top
      if (progress > 0.1) {
        ctx.save();
        const valSize = config.valSize || 22;
        ctx.font = getFont(config, 'bold', valSize);
        ctx.fillStyle = config.labelColor || '#FFFFFF';
        ctx.textAlign = 'center';
        const displayVal = Math.round(d.value * progress);
        ctx.fillText(`${config.valPrefix || ''}${formatValue(displayVal, config)}${config.valSuffix || ''}`, x + barWidth / 2, y - 10);
        ctx.restore();
      }

      // X-Axis Category label (Rotatable 0, 45, 90 deg)
      drawRotatedAxisLabel(ctx, d.label, x + barWidth / 2, margin.top + chartH + 18, config);
    });
  }

  // --- 2. HORIZONTAL BAR CHART ---
  function drawHorizontalBarChart(ctx, width, height, progress, config) {
    const data = config.data || [];
    if (!data.length) return;

    const colors = Palettes[config.palette || 'neonCyber'];
    const margin = { top: 180, right: 120, bottom: 80, left: 260 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 10) * 1.15;
    const barHeight = Math.min(60, (chartH / data.length) * 0.65);
    const step = chartH / data.length;

    data.forEach((d, i) => {
      const y = margin.top + (i * step) + (step - barHeight) / 2;
      const targetW = (d.value / maxVal) * chartW;
      const currentW = targetW * progress;
      const color = d.color || colors[i % colors.length];

      const grad = ctx.createLinearGradient(margin.left, y, margin.left + currentW, y);
      grad.addColorStop(0, color);
      grad.addColorStop(1, adjustColorBrightness(color, 25));
      ctx.fillStyle = grad;

      drawRoundedRect(ctx, margin.left, y, currentW, barHeight, 8, false, true);

      // Category label at left
      ctx.save();
      const axisSize = config.axisSize || 18;
      ctx.font = getFont(config, 'bold', axisSize);
      ctx.fillStyle = config.axisColor || '#E2E8F0';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.label, margin.left - 20, y + barHeight / 2);
      ctx.restore();

      // Value at right of bar
      if (progress > 0.1) {
        ctx.save();
        const valSize = config.valSize || 22;
        ctx.font = getFont(config, 'bold', valSize);
        ctx.fillStyle = config.labelColor || '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const displayVal = Math.round(d.value * progress);
        ctx.fillText(`${config.valPrefix || ''}${formatValue(displayVal, config)}${config.valSuffix || ''}`, margin.left + currentW + 15, y + barHeight / 2);
        ctx.restore();
      }
    });
  }

  // --- 3. GROUPED BAR CHART ---
  function drawGroupedBarChart(ctx, width, height, progress, config) {
    const data = config.data || [];
    if (!data.length) return;

    const colors = Palettes[config.palette || 'neonCyber'];
    const colorA = colors[0];
    const colorB = colors[2] || '#F72585';
    const series1Name = config.series1Name || 'Series 1';
    const series2Name = config.series2Name || 'Series 2';

    const margin = getChartMargins(config);
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxVal = Math.max(...data.map(d => Math.max(d.value, d.value2 || d.value * 0.7)), 10) * 1.15;
    const groupWidth = (chartW / data.length) * 0.75;
    const barWidth = groupWidth / 2 - 4;
    const step = chartW / data.length;

    drawGrid(ctx, margin.left, margin.top, chartW, chartH, maxVal, config);
    drawLegendDuo(ctx, width - 360, 130, colorA, series1Name, colorB, series2Name, config);

    data.forEach((d, i) => {
      const groupX = margin.left + (i * step) + (step - groupWidth) / 2;
      const val1 = d.value;
      const val2 = d.value2 !== undefined ? d.value2 : Math.round(d.value * 0.72);

      // Bar 1
      const h1 = (val1 / maxVal) * chartH * progress;
      const y1 = margin.top + chartH - h1;
      ctx.fillStyle = colorA;
      drawRoundedRect(ctx, groupX, y1, barWidth, h1, 8, true, false);

      // Bar 2
      const h2 = (val2 / maxVal) * chartH * progress;
      const y2 = margin.top + chartH - h2;
      ctx.fillStyle = colorB;
      drawRoundedRect(ctx, groupX + barWidth + 6, y2, barWidth, h2, 8, true, false);

      // Values
      if (progress > 0.15) {
        ctx.save();
        const valSize = Math.max(12, Math.round((config.valSize || 22) * 0.8));
        ctx.font = getFont(config, 'bold', valSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`${config.valPrefix || ''}${formatValue(Math.round(val1 * progress), config)}`, groupX + barWidth / 2, y1 - 8);
        ctx.fillText(`${config.valPrefix || ''}${formatValue(Math.round(val2 * progress), config)}`, groupX + barWidth + 6 + barWidth / 2, y2 - 8);
        ctx.restore();
      }

      // X-Axis Category label
      drawRotatedAxisLabel(ctx, d.label, groupX + groupWidth / 2, margin.top + chartH + 18, config);
    });
  }

  // --- 4. STACKED BAR CHART ---
  function drawStackedBarChart(ctx, width, height, progress, config) {
    const data = config.data || [];
    if (!data.length) return;

    const colors = Palettes[config.palette || 'neonCyber'];
    const colorA = colors[0];
    const colorB = colors[1] || '#7B2CBF';

    const margin = getChartMargins(config);
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxVal = Math.max(...data.map(d => {
      const v1 = d.value;
      const v2 = d.value2 !== undefined ? d.value2 : v1 * 0.55;
      return v1 + v2;
    }), 10) * 1.15;

    const barWidth = Math.min(90, (chartW / data.length) * 0.6);
    const step = chartW / data.length;

    drawGrid(ctx, margin.left, margin.top, chartW, chartH, maxVal, config);
    drawLegendDuo(ctx, width - 360, 130, colorA, 'Segment A', colorB, 'Segment B', config);

    data.forEach((d, i) => {
      const x = margin.left + (i * step) + (step - barWidth) / 2;
      const val1 = d.value;
      const val2 = d.value2 !== undefined ? d.value2 : Math.round(d.value * 0.55);

      const h1 = (val1 / maxVal) * chartH * progress;
      const h2 = (val2 / maxVal) * chartH * progress;

      const yBottom = margin.top + chartH - h1;
      const yTop = yBottom - h2;

      ctx.fillStyle = colorA;
      ctx.fillRect(x, yBottom, barWidth, h1);

      ctx.fillStyle = colorB;
      drawRoundedRect(ctx, x, yTop, barWidth, h2, 10, true, false);

      if (progress > 0.15) {
        ctx.save();
        const valSize = config.valSize || 22;
        ctx.font = getFont(config, 'bold', valSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        const total = Math.round((val1 + val2) * progress);
        ctx.fillText(`${config.valPrefix || ''}${formatValue(total, config)}${config.valSuffix || ''}`, x + barWidth / 2, yTop - 10);
        ctx.restore();
      }

      drawRotatedAxisLabel(ctx, d.label, x + barWidth / 2, margin.top + chartH + 18, config);
    });
  }

  // --- 5 & 6. LINE & GRADIENT WAVE AREA CHART ---
  function drawLineChart(ctx, width, height, progress, config, isArea = false) {
    const data = config.data || [];
    if (data.length < 2) return;

    const colors = Palettes[config.palette || 'neonCyber'];
    const lineColor = colors[0];
    const margin = getChartMargins(config);
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 10) * 1.15;
    const step = chartW / (data.length - 1);

    drawGrid(ctx, margin.left, margin.top, chartW, chartH, maxVal, config);

    const points = data.map((d, i) => ({
      x: margin.left + i * step,
      y: margin.top + chartH - ((d.value / maxVal) * chartH * progress),
      origVal: d.value,
      label: d.label
    }));

    if (isArea) {
      const areaGrad = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartH);
      areaGrad.addColorStop(0, hexToRgba(lineColor, 0.65));
      areaGrad.addColorStop(0.6, hexToRgba(colors[1] || lineColor, 0.25));
      areaGrad.addColorStop(1, hexToRgba(lineColor, 0.0));

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, margin.top + chartH);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(points[points.length - 1].x, margin.top + chartH);
      ctx.closePath();
      ctx.fillStyle = areaGrad;
      ctx.fill();
      ctx.restore();
    }

    // Line Path
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = isArea ? 5 : 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Data points & dots
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      drawRotatedAxisLabel(ctx, p.label, p.x, margin.top + chartH + 18, config);

      if (progress > 0.2) {
        ctx.save();
        const valSize = config.valSize || 20;
        ctx.font = getFont(config, 'bold', valSize);
        ctx.fillStyle = config.labelColor || '#FFFFFF';
        ctx.textAlign = 'center';
        const displayVal = Math.round(p.origVal * progress);
        ctx.fillText(`${config.valPrefix || ''}${formatValue(displayVal, config)}${config.valSuffix || ''}`, p.x, p.y - 18);
        ctx.restore();
      }
    });
    ctx.restore();
  }

  // --- 7 & 8. PIE & DONUT CHART ---
  function drawPieChart(ctx, width, height, progress, config, isDonut = false) {
    const data = config.data || [];
    if (!data.length) return;

    const colors = Palettes[config.palette || 'neonCyber'];
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const centerX = width * 0.40;
    const centerY = height * 0.55;
    const radius = Math.min(width, height) * 0.32;
    const innerRadius = isDonut ? radius * 0.58 : 0;

    let currentAngle = -Math.PI / 2;
    const totalAngle = Math.PI * 2 * progress;

    ctx.save();
    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * totalAngle;
      const color = d.color || colors[i % colors.length];

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      if (isDonut) {
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      } else {
        ctx.lineTo(centerX, centerY);
      }
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = config.transparent ? 'rgba(0,0,0,0.1)' : (config.bgColor || '#0F1214');
      ctx.lineWidth = 3;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    if (isDonut && progress > 0.2) {
      const centerSize = Math.round((config.valSize || 22) * 1.6);
      ctx.font = getFont(config, 'bold', centerSize);
      ctx.fillStyle = config.titleColor || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const curTotal = Math.round(total * progress);
      ctx.fillText(`${config.valPrefix || ''}${formatValue(curTotal, config)}${config.valSuffix || ''}`, centerX, centerY);
    }
    ctx.restore();

    // Side Legend with customizable size
    const legendX = width * 0.68;
    const legendY = height * 0.34;
    const legendSize = config.legendSize || 18;
    const step = legendSize + 22;

    ctx.save();
    data.forEach((d, i) => {
      const y = legendY + i * step;
      const color = d.color || colors[i % colors.length];
      const pct = ((d.value / total) * 100).toFixed(1);

      ctx.beginPath();
      ctx.arc(legendX, y, legendSize * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.font = getFont(config, '500', legendSize);
      ctx.fillStyle = '#E2E8F0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${d.label}: ${formatValue(d.value, config)} (${formatValue(pct, config)}%)`, legendX + legendSize + 10, y);
    });
    ctx.restore();
  }

  // --- 9. RADIAL PROGRESS RINGS ---
  function drawRadialProgressChart(ctx, width, height, progress, config) {
    const data = config.data || [];
    if (!data.length) return;

    const colors = Palettes[config.palette || 'neonCyber'];
    const centerX = width * 0.40;
    const centerY = height * 0.55;
    const maxVal = Math.max(...data.map(d => d.value), 100);
    const ringCount = Math.min(6, data.length);
    const baseRadius = 80;
    const ringWidth = 24;
    const ringSpacing = 12;

    ctx.save();
    for (let i = 0; i < ringCount; i++) {
      const d = data[i];
      const r = baseRadius + i * (ringWidth + ringSpacing);
      const color = d.color || colors[i % colors.length];
      const pct = Math.min(1.0, d.value / maxVal);
      const sweepAngle = (Math.PI * 2 * pct) * progress;

      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = ringWidth;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, r, -Math.PI / 2, -Math.PI / 2 + sweepAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = ringWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();

    // Side Legend
    const legendX = width * 0.68;
    const legendY = height * 0.35;
    const legendSize = config.legendSize || 18;
    const step = legendSize + 26;

    ctx.save();
    for (let i = 0; i < ringCount; i++) {
      const d = data[i];
      const y = legendY + i * step;
      const color = d.color || colors[i % colors.length];
      const pct = Math.round((d.value / maxVal) * 100);

      ctx.beginPath();
      ctx.arc(legendX, y, legendSize * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.font = getFont(config, 'bold', legendSize);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${d.label}`, legendX + legendSize + 10, y);

      ctx.font = `600 ${legendSize}px JetBrains Mono, monospace`;
      ctx.fillStyle = color;
      ctx.fillText(`${formatValue(pct, config)}%`, legendX + 220, y);
    }
    ctx.restore();
  }

  // --- 10. BAR CHART RACE ---
  function drawBarChartRace(ctx, width, height, progress, config) {
    const periods = config.periods || [];
    if (!periods.length) return drawHorizontalBarChart(ctx, width, height, progress, config);

    const totalPeriods = periods.length;
    const globalT = progress * (totalPeriods - 1);
    const currentIndex = Math.min(totalPeriods - 2, Math.floor(globalT));
    const localT = globalT - currentIndex;

    const pA = periods[currentIndex];
    const pB = periods[currentIndex + 1] || pA;

    const items = pA.data.map((item, idx) => {
      const nextItem = pB.data.find(x => x.label === item.label) || item;
      const val = item.value + (nextItem.value - item.value) * localT;
      return { label: item.label, value: val, color: item.color };
    });

    items.sort((a, b) => b.value - a.value);

    const currentYear = pA.year || pA.period || `P${currentIndex + 1}`;
    drawHorizontalBarChart(ctx, width, height, 1.0, {
      ...config,
      data: items.slice(0, 8),
      title: `${config.title || 'Dynamic Ranking'} — ${currentYear}`
    });
  }

  // --- HELPER: ROTATED AXIS LABELS (Word-Style 0, 45, 90 deg) ---
  function drawRotatedAxisLabel(ctx, text, x, y, config) {
    const rot = parseInt(config.labelRotation || 0);
    const fontSize = config.axisSize || 18;

    ctx.save();
    ctx.font = getFont(config, '500', fontSize);
    ctx.fillStyle = config.axisColor || '#CBD5E1';

    if (rot === 90) {
      // 90° Vertical Rotation
      ctx.translate(x, y + 5);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    } else if (rot === 45) {
      // 45° Slanted Rotation
      ctx.translate(x, y + 5);
      ctx.rotate(Math.PI / 4);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    } else {
      // 0° Standard Horizontal
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(text, x, y + 10);
    }
    ctx.restore();
  }

  function getChartMargins(config) {
    const rot = parseInt(config.labelRotation || 0);
    // Increase bottom margin when labels are rotated 45 or 90 degrees
    let bottomMargin = 120;
    if (rot === 45) bottomMargin = 150;
    if (rot === 90) bottomMargin = 180;

    return { top: 180, right: 100, bottom: bottomMargin, left: 120 };
  }

  function drawLegendDuo(ctx, x, y, color1, label1, color2, label2, config) {
    const legendSize = config.legendSize || 16;
    ctx.save();
    // Series 1
    ctx.fillStyle = color1;
    ctx.fillRect(x, y - legendSize * 0.75, legendSize, legendSize);
    ctx.font = getFont(config, '600', legendSize);
    ctx.fillStyle = '#CBD5E1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label1, x + legendSize + 8, y);

    // Series 2
    ctx.fillStyle = color2;
    ctx.fillRect(x + 150, y - legendSize * 0.75, legendSize, legendSize);
    ctx.fillText(label2, x + 150 + legendSize + 8, y);
    ctx.restore();
  }

  function drawGrid(ctx, left, top, w, h, maxVal, config) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    const lines = 4;
    const axisSize = Math.max(12, Math.round((config.axisSize || 18) * 0.85));

    for (let i = 0; i <= lines; i++) {
      const y = top + (h / lines) * i;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + w, y);
      ctx.stroke();

      const val = Math.round(maxVal * (1 - i / lines));
      ctx.font = getFont(config, 'normal', axisSize);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatValue(val, config), left - 15, y);
    }
    ctx.setLineDash([]);
    ctx.restore();
  }
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawRoundedRect(ctx, x, y, w, h, r, topOnly = false, rightOnly = false) {
    if (w <= 0 || h <= 0) return;
    ctx.beginPath();
    if (topOnly) {
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h);
    } else if (rightOnly) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x, y + h);
    } else {
      ctx.roundRect(x, y, w, h, r);
    }
    ctx.closePath();
    ctx.fill();
  }

  function adjustColorBrightness(hex, percent) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    let num = parseInt(hex, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + percent));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function hexToRgba(hex, alpha) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    const num = parseInt(hex, 16);
    return `rgba(${(num >> 16)}, ${(num >> 8) & 0x00FF}, ${(num & 0x0000FF)}, ${alpha})`;
  }

  return {
    renderFrame,
    Palettes,
    Easing
  };
})();
