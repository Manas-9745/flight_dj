import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const publicDir = 'c:\\Users\\Manas S Parekar\\OneDrive\\Desktop\\dj_flight\\frontend\\public';

// HTML template with embedded SVG
const svgContent = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');

function createHtml(size, isMaskable = false) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${size}px;
      height: ${size}px;
      overflow: hidden;
      background: ${isMaskable ? '#0F1318' : 'transparent'};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: ${isMaskable ? Math.round(size * 0.8) : size}px;
      height: ${isMaskable ? Math.round(size * 0.8) : size}px;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;
}

async function renderIcon(htmlFile, outputFile, width, height) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      `--screenshot=${outputFile}`,
      `file:///${htmlFile.replace(/\\/g, '/')}`
    ];
    const proc = spawn(edgePath, args);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Edge exited with code ${code}`));
    });
  });
}

async function main() {
  const icons = [
    { name: 'pwa-192x192.png', size: 192, maskable: false },
    { name: 'pwa-512x512.png', size: 512, maskable: false },
    { name: 'maskable-icon-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false }
  ];

  for (const icon of icons) {
    const tempHtml = path.join(publicDir, `temp_${icon.size}_${icon.maskable ? 'm' : 's'}.html`);
    const outputPath = path.join(publicDir, icon.name);
    fs.writeFileSync(tempHtml, createHtml(icon.size, icon.maskable));
    await renderIcon(tempHtml, outputPath, icon.size, icon.size);
    fs.unlinkSync(tempHtml);
    console.log(`Generated: ${icon.name} (${icon.size}x${icon.size})`);
  }
}

main().catch(console.error);
