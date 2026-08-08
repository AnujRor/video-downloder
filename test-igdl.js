import { igdl } from 'igdl.js';
(async () => {
  try {
    const res = await igdl('https://www.instagram.com/reel/DE-R0k0uY_e/');
    console.log(res);
  } catch (e) {
    console.error(e);
  }
})();
