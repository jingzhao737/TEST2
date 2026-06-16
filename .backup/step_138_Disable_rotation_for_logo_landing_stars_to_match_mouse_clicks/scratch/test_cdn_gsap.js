const http = require('https');

const urls = [
  'https://cdn.jsdmirror.com/npm/gsap@3.12.5/ScrollTrigger.js/+esm',
  'https://cdn.jsdmirror.com/npm/gsap@3.12.5/Flip.js/+esm',
  'https://cdn.jsdmirror.com/npm/gsap@3.12.5/dist/ScrollTrigger.min.js/+esm',
  'https://cdn.jsdmirror.com/npm/gsap@3.12.5/dist/Flip.min.js/+esm'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(url, (res) => {
      resolve({
        url,
        statusCode: res.statusCode,
        time: Date.now() - start
      });
    }).on('error', (err) => {
      resolve({
        url,
        statusCode: 500,
        error: err.message,
        time: Date.now() - start
      });
    });
  });
}

(async () => {
  console.log("Testing GSAP plugin mirror URLs...");
  for (const url of urls) {
    const res = await testUrl(url);
    console.log(`[${res.statusCode}] ${res.time}ms - ${res.url}`);
  }
  console.log("Testing complete.");
})();
