import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('node_modules/@vladmandic/face-api/model');
const destDir = path.resolve('public/models');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    if (file.startsWith('face_') || file.startsWith('tiny_face_')) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
  }
  console.log('✓ Offline AI Face models successfully synced to public/models');
} else {
  console.warn('⚠️ @vladmandic/face-api models not found in node_modules');
}
