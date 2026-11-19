const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 transparent/colored PNG base64
const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const samplePngBuffer = Buffer.from(samplePngBase64, 'base64');

['icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'].forEach(file => {
  const target = path.join(assetsDir, file);
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, samplePngBuffer);
    console.log(`Generated placeholder asset: ${file}`);
  }
});
