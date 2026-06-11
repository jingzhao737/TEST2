const http = require('https');

const urls = [
  'https://cdn.jsdmirror.com/npm/three@0.170.0/build/three.module.js',
  'https://cdn.jsdmirror.com/npm/three@0.170.0/examples/jsm/controls/TrackballControls.js',
  'https://cdn.jsdmirror.com/npm/gsap@3.12.5/+esm',
  'https://cdn.jsdmirror.com/npm/gsap@3.12.5/ScrollTrigger/+esm',
  'https://cdn.jsdmirror.com/npm/gsap@3.12.5/Flip/+esm'
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
  console.log("Testing CDN URLs...");
  for (const url of urls) {
    const res = await testUrl(url);
    console.log(`[${res.statusCode}] ${res.time}ms - ${res.url} ${res.error ? '(' + res.error + ')' : ''}`);
  }
  console.log("Testing complete.");
})();
