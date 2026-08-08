import vreden from "@vreden/youtube_scraper";

async function test() {
  try {
    const result = await vreden.ytmp4('https://www.youtube.com/shorts/3i_V-rF3wYk', 1080);
    console.log("1080p:", result);
    const result2 = await vreden.ytmp4('https://www.youtube.com/shorts/3i_V-rF3wYk', 720);
    console.log("720p:", result2);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
