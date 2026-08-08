import vreden from "@vreden/youtube_scraper";

async function test() {
  try {
    const result = await vreden.ytmp4('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1080);
    console.log(result);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
