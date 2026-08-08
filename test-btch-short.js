import btch from 'btch-downloader';

async function test() {
  try {
    const result = await btch.youtube('https://www.youtube.com/shorts/3i_V-rF3wYk');
    console.log(result);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
