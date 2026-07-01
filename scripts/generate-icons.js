const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'app', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Generate minimal SVG-based PNG using pure Node (no canvas dependency)
// Creates a simple colored square PNG with a cross symbol using raw PNG bytes

function createPNG(size) {
  // We'll generate SVG and save as .svg fallback since canvas may not be installed
  const r = Math.round(size * 0.2);
  const cx = size / 2;
  const arm = size * 0.28;
  const lw = size * 0.1;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#6366f1"/>
  <line x1="${cx}" y1="${cx - arm}" x2="${cx}" y2="${cx + arm}" stroke="white" stroke-width="${lw}" stroke-linecap="round"/>
  <line x1="${cx - arm}" y1="${cx}" x2="${cx + arm}" y2="${cx}" stroke="white" stroke-width="${lw}" stroke-linecap="round"/>
</svg>`;

  fs.writeFileSync(path.join(outDir, `icon-${size}.svg`), svg);
}

sizes.forEach(s => { createPNG(s); console.log(`icon-${s}.svg`); });
console.log('Icons generated in', outDir);
