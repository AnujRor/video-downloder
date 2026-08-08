import btch from 'btch-downloader';

async function test() {
  const url = 'https://www.instagram.com/reel/DE-R0k0uY_e/';
  try {
    const res = await btch.igdl(url);
    console.log('btch igdl:', res);
  } catch (e) {
    console.log('btch ig fail:', e.message);
  }
}
test();
