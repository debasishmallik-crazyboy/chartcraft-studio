const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const PORT = 3456;
const PUBLIC_DIR = path.join(__dirname, 'public');
const EXPORTS_DIR = path.join(__dirname, 'exports');

if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// Active render sessions in memory
const activeSessions = new Map();

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
  '.csv': 'text/csv',
  '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Frame-Index'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // 1. API: Start Render Session
  if (req.method === 'POST' && pathname === '/api/render-session/start') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        const sessionId = 'session_' + Date.now();
        const safeName = (config.name || 'Animated_Chart').replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_');
        const folderName = `${safeName}_${Date.now()}`;
        const projectDir = path.join(EXPORTS_DIR, folderName);
        const framesDir = path.join(projectDir, 'frames');
        fs.mkdirSync(framesDir, { recursive: true });

        const width = config.width || 1920;
        const height = config.height || 1080;
        const fps = config.fps || 60;
        const movFilename = `${safeName}_prores4444.mov`;
        const movPath = path.join(projectDir, movFilename).replace(/\\/g, '/');
        const pngPattern = path.join(framesDir, 'frame_%04d.png').replace(/\\/g, '/');

        // Spawn FFmpeg to encode ProRes 4444 + PNG sequence simultaneously
        const ffmpegArgs = [
          '-y',
          '-f', 'rawvideo',
          '-pix_fmt', 'rgba',
          '-s', `${width}x${height}`,
          '-r', `${fps}`,
          '-i', '-',
          // Output 1: Apple ProRes 4444 with Alpha (.mov)
          '-c:v', 'prores_ks',
          '-profile:v', '4444',
          '-pix_fmt', 'yuva444p10le',
          movPath,
          // Output 2: PNG Sequence (frames/frame_0001.png)
          '-c:v', 'png',
          pngPattern
        ];

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
        ffmpegProcess.stdin.on('error', err => {
          if (err.code !== 'EPIPE') console.error('FFmpeg stdin error:', err);
        });
        let ffmpegLogs = '';
        ffmpegProcess.stderr.on('data', data => {
          ffmpegLogs += data.toString();
        });

        // Save project json
        fs.writeFileSync(path.join(projectDir, 'project.chart.json'), JSON.stringify(config, null, 2));

        // Create README guide for NLE imports
        const readmeContent = `# ChartCraft Export: ${safeName}
Generated: ${new Date().toLocaleString()}
Resolution: ${width}x${height} @ ${fps} FPS

## Included Assets:
1. "${movFilename}": Apple ProRes 4444 (.mov) with 100% Transparent Alpha Channel.
   - Wondershare Filmora: Drag & drop directly into timeline Track 2 (Overlay).
   - Adobe Premiere Pro / DaVinci Resolve: Drag into timeline on top of footage.
   - Adobe After Effects / EffectCraft: Import directly as composition layer with Straight Alpha.

2. "frames/": Transparent PNG Sequence.
   - Wondershare Filmora: Import Media -> Select frame_0001.png -> Check "Image Sequence".
   - CapCut PC: Import media -> Select all frames or sequence folder.
   - FilmCraft: Import as transparent overlay layer.

3. "project.chart.json": Editable project specification.
   - Reopen in ChartCraft Studio anytime to change numbers or duration and click "Quick Update"!
`;
        fs.writeFileSync(path.join(projectDir, 'README.txt'), readmeContent);

        activeSessions.set(sessionId, {
          id: sessionId,
          config,
          folderName,
          projectDir,
          movFilename,
          movPath,
          framesDir,
          ffmpegProcess,
          ffmpegLogs: () => ffmpegLogs,
          totalFrames: config.totalFrames,
          receivedFrames: 0,
          startTime: Date.now()
        });

        sendJson(res, 200, { success: true, sessionId, projectDir, folderName });
      } catch (err) {
        sendJson(res, 500, { success: false, error: err.message });
      }
    });
    return;
  }

  // 2. API: Stream Chunk (Raw RGBA frame buffer)
  if (req.method === 'POST' && pathname === '/api/render-session/chunk') {
    const sessionId = req.headers['x-session-id'];
    const session = activeSessions.get(sessionId);
    if (!session) {
      return sendJson(res, 404, { success: false, error: 'Session not found' });
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const frameBuffer = Buffer.concat(chunks);
      try {
        session.ffmpegProcess.stdin.write(frameBuffer);
        session.receivedFrames++;
        sendJson(res, 200, {
          success: true,
          received: session.receivedFrames,
          total: session.totalFrames
        });
      } catch (err) {
        sendJson(res, 500, { success: false, error: err.message });
      }
    });
    return;
  }

  // 3. API: Finish Render Session
  if (req.method === 'POST' && pathname === '/api/render-session/finish') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { sessionId } = JSON.parse(body || '{}');
        const session = activeSessions.get(sessionId);
        if (!session) {
          return sendJson(res, 404, { success: false, error: 'Session not found' });
        }

        session.ffmpegProcess.stdin.end();
        session.ffmpegProcess.on('close', code => {
          activeSessions.delete(sessionId);
          if (code === 0) {
            // Compress PNG sequence into a zip file in the background for instant 1-click download
            const zipPath = path.join(session.projectDir, 'frames_sequence.zip');
            const psCmd = `Compress-Archive -Path "${session.framesDir}\\*" -DestinationPath "${zipPath}" -Force`;
            exec(`powershell -NoProfile -Command "${psCmd}"`, () => {
              // Zip finished
            });

            sendJson(res, 200, {
              success: true,
              folderName: session.folderName,
              projectDir: session.projectDir,
              movFilename: session.movFilename,
              movUrl: `/exports/${session.folderName}/${session.movFilename}`,
              zipUrl: `/exports/${session.folderName}/frames_sequence.zip`,
              jsonUrl: `/exports/${session.folderName}/project.chart.json`,
              totalFrames: session.receivedFrames,
              durationMs: Date.now() - session.startTime
            });
          } else {
            sendJson(res, 500, {
              success: false,
              error: `FFmpeg exited with code ${code}`,
              logs: session.ffmpegLogs()
            });
          }
        });
      } catch (err) {
        sendJson(res, 500, { success: false, error: err.message });
      }
    });
    return;
  }

  // 4. API: Open Export Folder in Windows Explorer (Guaranteed reliable via PowerShell)
  if (req.method === 'POST' && pathname === '/api/open-folder') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { folderPath } = JSON.parse(body || '{}');
        const target = (folderPath || EXPORTS_DIR).replace(/\//g, '\\');
        // Ensure folder exists
        if (!fs.existsSync(target)) {
          fs.mkdirSync(target, { recursive: true });
        }
        // Use PowerShell Start-Process to guarantee Explorer opens and focuses
        exec(`powershell -NoProfile -Command "Start-Process explorer.exe -ArgumentList '${target}'"`, (err) => {
          if (err) {
            // Fallback to start
            exec(`start "" "${target}"`);
          }
        });
        sendJson(res, 200, { success: true, folderOpened: target });
      } catch (err) {
        sendJson(res, 500, { success: false, error: err.message });
      }
    });
    return;
  }

  // 5. API: Sample CSV Template (English)
  if (req.method === 'GET' && pathname === '/api/sample-csv') {
    const csvContent = `Category,Value_1,Value_2\nJan,120,80\nFeb,195,140\nMar,310,210\nApr,250,190\nMay,420,330\nJun,580,450\n`;
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sample_chart_data.csv"',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(csvContent);
  }

  // 5b. API: Sample CSV Template (বাংলা / Bengali with UTF-8 BOM)
  if (req.method === 'GET' && pathname === '/api/sample-bengali-csv') {
    const bom = '\uFEFF';
    const csvContent = bom + `মাস/বিভাগ,বিক্রয়_২০২৫,বিক্রয়_২০২৬\nজানুয়ারি,১২০,৮৫\nফেব্রুয়ারি,১৯৫,১৩০\nমার্চ,৩১০,২১০\nএপ্রিল,২৫০,১৭৫\nমে,৪২০,৩১০\nজুন,৫৮০,৪৪০\n`;
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sample_bengali_chart_data.csv"',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(csvContent);
  }

  // 6. API: List Past Projects
  if (req.method === 'GET' && pathname === '/api/projects') {
    try {
      const items = fs.readdirSync(EXPORTS_DIR, { withFileTypes: true });
      const projects = [];
      for (const item of items) {
        if (item.isDirectory()) {
          const jsonFile = path.join(EXPORTS_DIR, item.name, 'project.chart.json');
          if (fs.existsSync(jsonFile)) {
            try {
              const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
              projects.push({
                folderName: item.name,
                fullPath: path.join(EXPORTS_DIR, item.name),
                config: data,
                updatedAt: fs.statSync(jsonFile).mtime
              });
            } catch (e) {}
          }
        }
      }
      projects.sort((a, b) => b.updatedAt - a.updatedAt);
      sendJson(res, 200, { success: true, projects });
    } catch (err) {
      sendJson(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // 7. Serve Static Files (Public Web UI & Exports)
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    // Check if it's an exported asset (/exports/...)
    if (pathname.startsWith('/exports/')) {
      filePath = path.join(__dirname, pathname);
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ChartCraft Studio is LIVE on http://localhost:${PORT}`);
  console.log(`   Export storage: ${EXPORTS_DIR}`);
  console.log(`=======================================================`);
});
