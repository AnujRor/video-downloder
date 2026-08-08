import btch from 'btch-downloader';
import { instagramdl } from '@bochilteam/scraper';

async function test() {
  const url = 'https://www.instagram.com/reel/DE-R0k0uY_e/';
  try {
    const res2 = await btch.igdl(url);
    console.log('btch:', res2);
  } catch(e) {
    console.log('btch error', e.message);
  }

  try {
    const res3 = await instagramdl(url);
    console.log('bochilteam:', res3);
  } catch(e) {
    console.log('bochilteam error', e.message);
  }
}
test();
