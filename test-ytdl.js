import youtubedl from "youtube-dl-exec";

async function test() {
  try {
    const output = await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        format: 'best',
        youtubeSkipDashManifest: true
      });
    console.log("Success!");
  } catch (e) {
    console.log("Error object:");
    console.error(e);
  }
}
test();
