const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 128];
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (const size of sizes) {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${size}px;
    height: ${size}px;
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: ${size}px;
    height: ${size}px;
    display: block;
  }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
  <rect width="24" height="24" rx="4.5" fill="#0A66C2"/>
  <path fill="#FFFFFF" d="M19 19h-3.1v-4.9c0-1.2-.02-2.7-1.6-2.7s-1.9 1.3-1.9 2.6V19H9.2V9h3v1.4h.04c.4-.8 1.4-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8V19zM5.7 7.6c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8zM7.2 19H4.1V9h3.1v10z"/>
</svg>
</body>
</html>`;

  const tmpHtml = path.join(iconsDir, `temp_${size}.html`);
  const outPng = path.join(iconsDir, `icon${size}.png`);

  fs.writeFileSync(tmpHtml, htmlContent, 'utf-8');

  try {
    execSync(
      `"${chromePath}" --headless --disable-gpu --screenshot="${outPng}" --window-size=${size},${size} --default-background-color=00000000 "file:///${tmpHtml.replace(/\\/g, '/')}"`,
      { stdio: 'ignore' }
    );
    console.log(`Generated icon${size}.png (Size: ${fs.statSync(outPng).size} bytes)`);
  } finally {
    if (fs.existsSync(tmpHtml)) {
      fs.unlinkSync(tmpHtml);
    }
  }
}
