import { snapsave } from 'snapsave-media-downloader';

async function test() {
  try {
    const res = await snapsave('https://www.instagram.com/reel/DE-R0k0uY_e/');
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
