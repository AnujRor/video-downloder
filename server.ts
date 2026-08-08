import express from "express";
import path from "path";
import youtubedl from "youtube-dl-exec";
import { createServer as createViteServer } from "vite";
import vreden from "@vreden/youtube_scraper";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for video download
  app.post("/api/get-video", async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`Fetching info for: ${url}`);
      
      // If it's a youtube URL, use the scraper which bypasses cloud blocks
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
           const originalConsoleError = console.error;
           console.error = (...args: any[]) => {
             if (args[0] === "Converting error:") return;
             originalConsoleError.apply(console, args);
           };

           let result;
           try {
             result = await vreden.ytmp4(url, 1080);
             
             if (!result || !result.status || (result.download && !result.download.url)) {
               result = await vreden.ytmp4(url, 720);
             }
             if (!result || !result.status || (result.download && !result.download.url)) {
               result = await vreden.ytmp4(url, 360);
             }
             
             if (result && typeof result === 'object') {
               const title = result?.metadata?.title || result?.data?.title || result?.title || "Unknown Title";
               const thumbnail = result?.metadata?.thumbnail || result?.data?.thumbnail || result?.thumbnail || "";
               const downloadUrl = result?.download?.url || result?.data?.url || result?.url;

               if (downloadUrl) {
                 return res.json({
                   title,
                   thumbnail,
                   downloadUrl
                 });
               }
             }
           } finally {
             console.error = originalConsoleError;
           }
        } catch (scrapeErr) {
           // Silently fallback to yt-dlp
        }
      }

      // Execute yt-dlp to get the best video format and direct link
      const output = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        format: 'best', // Ensure best quality (video + audio combined)
        youtubeSkipDashManifest: true,
        // Optional headers to avoid being blocked
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        ]
      });

      // Usually, youtube-dl-exec returns a parsed JSON object when dumpSingleJson is used.
      const videoData = output as any;
      
      const title = videoData.title || "Unknown Title";
      const thumbnail = videoData.thumbnail || videoData.thumbnails?.[0]?.url || "";
      
      // Find the best download URL. Some formats don't have direct video URL, try to find a valid one.
      // Often `videoData.url` is the requested direct link for 'best'
      let downloadUrl = videoData.url;
      
      if (!downloadUrl && videoData.formats && videoData.formats.length > 0) {
        // Find best format with both video and audio by sorting by height and bitrate
        const sortedFormats = videoData.formats
          .filter((f: any) => f.url && !f.url.includes('manifest') && f.acodec !== 'none' && f.vcodec !== 'none' && f.vcodec !== 'mhtml')
          .sort((a: any, b: any) => {
             const heightA = a.height || 0;
             const heightB = b.height || 0;
             if (heightB !== heightA) return heightB - heightA; // Descending height
             
             const tbrA = a.tbr || 0;
             const tbrB = b.tbr || 0;
             return tbrB - tbrA; // Descending bitrate
          });
          
        downloadUrl = sortedFormats[0]?.url || videoData.formats.find((f: any) => f.url)?.url;
      }

      if (!downloadUrl) {
        return res.status(400).json({ error: "Could not extract direct download URL." });
      }

      res.json({
        title,
        thumbnail,
        downloadUrl
      });
    } catch (error: any) {
      let errorMsg = error.message || "Failed to process the link.";
      
      if (errorMsg.includes("Sign in to confirm you’re not a bot") || errorMsg.includes("signin/rejected") || errorMsg.includes("Unsupported URL: https://accounts.google.com") || url.includes("youtube.com") || url.includes("youtu.be")) {
        errorMsg = "YouTube blocked the request. (Note: Cloud server IPs are blocked by YouTube. This app will work when run locally on your machine).";
      } else if (errorMsg.includes("Instagram API is not granting access") || url.includes("instagram.com")) {
        errorMsg = "Instagram blocked the request. (Note: Cloud server IPs are blocked by Instagram. This app will work when run locally on your machine).";
      } else if (error.message && error.message.includes("is not a valid URL")) {
         errorMsg = "Invalid URL provided.";
      }
      
      res.status(500).json({ error: errorMsg, isBlocked: true, originalUrl: url });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
