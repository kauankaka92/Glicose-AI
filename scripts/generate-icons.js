const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');

  // Converter icon-192.svg para icon-192.png
  await sharp(path.join(iconsDir, 'icon-192.svg'))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));

  // Converter icon-512.svg para icon-512.png
  await sharp(path.join(iconsDir, 'icon-512.svg'))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));

  console.log('Ícones PNG gerados com sucesso!');
}

convertIcons().catch(console.error);