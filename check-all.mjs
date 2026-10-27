import http from 'http';

const tests = [
  {name: 'YouTube - Normal', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'},
  {name: 'YouTube - Shorts', url: 'https://www.youtube.com/shorts/aqz-KE-bpKQ'},
  {name: 'Instagram - Reel', url: 'https://www.instagram.com/reels/DQbHMuLEtmt/'},
  {name: 'Instagram - Post', url: 'https://www.instagram.com/p/DREgJfUiPBH/'},
  {name: 'TikTok', url: 'https://www.tiktok.com/@tiktok/video/7000000000000000000'},
  {name: 'Facebook', url: 'https://www.facebook.com/watch/?v=123456789'},
  {name: 'X (Twitter)', url: 'https://x.com/elonmusk/status/1234567890'},
];

function test(t) {
  return new Promise((resolve) => {
    const data = JSON.stringify({url: t.url});
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/get-video',
      method: 'POST',
      headers: {'Content-Type': 'application/json'}
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve({...t, status: res.statusCode, ok: !!json.downloadUrl, json});
        } catch(e) {
          resolve({...t, status: res.statusCode, ok: false, raw: d});
        }
      });
    });
    req.on('error', (e) => resolve({...t, ok: false, err: e.message}));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing API at http://localhost:3000/api/get-video\n');
  for (const t of tests) {
    const r = await test(t);
    console.log('='.repeat(60));
    console.log(r.name);
    console.log('URL:', r.url);
    console.log('Status:', r.status);
    if(r.ok) {
      console.log('SUCCESS ✓');
      console.log('Title:', r.json.title);
      console.log('Has thumbnail:', !!r.json.thumbnail);
      console.log('Download URL:', r.json.downloadUrl.substring(0, 80) + '...');
      console.log('isFallback:', r.json.isFallback || false);
    } else {
      console.log('FAILED ✗');
      console.log(r.json?.error || r.err || r.raw?.substring(0,100));
    }
  }
  console.log('\n' + '='.repeat(60));
}
run();
