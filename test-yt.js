import btch from 'btch-downloader';

async function test() {
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  try {
    const res = await btch.youtube(url);
    console.log('btch youtube:', res);
  } catch (e) {
    console.log('btch fail:', e.message);
  }
}
test();
