const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compareImages(img1Path, img2Path) {
  const img1 = await sharp(img1Path).raw().toBuffer({ resolveWithObject: true });
  const img2 = await sharp(img2Path).raw().toBuffer({ resolveWithObject: true });

  if (img1.info.width !== img2.info.width || img1.info.height !== img2.info.height) {
    return `Dimensions mismatch: ${img1.info.width}x${img1.info.height} vs ${img2.info.width}x${img2.info.height}`;
  }

  let diffPixels = 0;
  const data1 = img1.data;
  const data2 = img2.data;
  const len = data1.length;

  for (let i = 0; i < len; i += 4) {
    const rDiff = Math.abs(data1[i] - data2[i]);
    const gDiff = Math.abs(data1[i+1] - data2[i+1]);
    const bDiff = Math.abs(data1[i+2] - data2[i+2]);
    if (rDiff > 2 || gDiff > 2 || bDiff > 2) {
      diffPixels++;
    }
  }

  return diffPixels;
}

async function main() {
  const dir = 'C:/Users/jackchen/.gemini/antigravity/brain/b97e653b-10c3-464c-a52f-949e1ff66140/scratch';
  console.log("Comparing screenshot sequence...");
  for (let i = 1; i < 8; i++) {
    const file1 = path.join(dir, `hover_step_${i}.png`);
    const file2 = path.join(dir, `hover_step_${i+1}.png`);
    if (fs.existsSync(file1) && fs.existsSync(file2)) {
      try {
        const diff = await compareImages(file1, file2);
        console.log(`Diff between step ${i} and ${i+1}: ${diff} pixels`);
      } catch (err) {
        console.error(`Error comparing step ${i} and ${i+1}:`, err);
      }
    } else {
      console.log(`Missing file(s): ${file1} or ${file2}`);
    }
  }
}

main();
