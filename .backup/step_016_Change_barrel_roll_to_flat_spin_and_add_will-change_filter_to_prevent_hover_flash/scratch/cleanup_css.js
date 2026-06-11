const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../styles.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Find the start of the old block
const startMarker = '/* ════════════ CINEMATIC SCROLL-REVEAL GALLERY ═══════════ */';
const startIndex = content.indexOf(startMarker);

// Find the start of the motion carousel section
const endMarker = 'MOTION VIDEO CAROUSEL';
const endIndex = content.indexOf(endMarker, startIndex !== -1 ? startIndex : 0);

if (startIndex !== -1 && endIndex !== -1) {
  // We want to find the comment start of the end marker, which is before "MOTION VIDEO CAROUSEL"
  const commentStart = content.lastIndexOf('/*', endIndex);
  
  if (commentStart !== -1 && commentStart > startIndex) {
    const before = content.slice(0, startIndex);
    const after = content.slice(commentStart);
    fs.writeFileSync(cssPath, before + after, 'utf8');
    console.log("CSS cleaned up successfully!");
  } else {
    console.log("Could not find comment start of end marker.");
  }
} else {
  console.log(`Could not find markers. startIndex=${startIndex}, endIndex=${endIndex}`);
}
