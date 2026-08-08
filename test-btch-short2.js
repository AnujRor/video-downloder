import btch from 'btch-downloader';

async function test() {
  try {
    const result = await btch.youtube('https://www.youtube.com/watch?v=3i_V-rF3wYk');
    console.log(result);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
