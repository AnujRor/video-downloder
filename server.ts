import express from "express";
import youtubedl from "youtube-dl-exec";
import vreden from "@vreden/youtube_scraper";
import btch from "btch-downloader";
import { snapsave } from "snapsave-media-downloader";
import allmedia from "allmediadl";
import nayan from "nayan-media-downloaders";

const app = express();

app.use(express.json());

function isValidUrl(string: string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function isDirectMediaUrl(u: string) {
  if (!u || typeof u !== "string") return false;
  try {
    const url = new URL(u);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    // Reject social profile/homepage links
    if (url.pathname === "/" || url.pathname === "") return false;
    if (url.hostname.includes("facebook.com") && url.pathname.includes("/profile.php")) return false;
    if (url.hostname.includes("instagram.com") && (url.pathname === "/" || url.pathname.match(/^\/[^/]+\/?$/))) return false;
    // Accept if looks like media
    if (u.includes(".mp4") || u.includes(".webm") || u.includes(".m4v") || u.includes(".mp3") || u.includes(".m3u8")) return true;
    // Some CDNs don't have extension in path but are media
    if (u.length > 60 && (u.includes("video") || u.includes("media") || u.includes("cdn") || u.includes("savetube") || u.includes("snap"))) return true;
    return false;
  } catch {
    return false;
  }
}

function normalizeResult(result: any, originalUrl?: string) {
  if (!result) return null;

  // If it's a string
  if (typeof result === "string" && result.startsWith("http")) {
    if (!isDirectMediaUrl(result)) return null;
    return { title: "Video", thumbnail: "", downloadUrl: result };
  }

  // Common patterns
  const title =
    result?.title ||
    result?.data?.title ||
    result?.metadata?.title ||
    result?.info?.title ||
    result?.result?.title ||
    result?.video?.title ||
    "Video";

  const thumbnail =
    result?.thumbnail ||
    result?.thumb ||
    result?.cover ||
    result?.data?.thumbnail ||
    result?.data?.thumb ||
    result?.metadata?.thumbnail ||
    result?.image ||
    result?.video?.thumbnail ||
    "";

  // Try to find download URL in various places
  let downloadUrl =
    result?.url ||
    result?.downloadUrl ||
    result?.link ||
    result?.videoUrl ||
    result?.video_url ||
    result?.data?.url ||
    result?.data?.downloadUrl ||
    result?.data?.link ||
    result?.download?.url ||
    result?.media?.[0]?.url ||
    result?.medias?.[0]?.url ||
    result?.result?.url ||
    result?.links?.[0]?.url ||
    result?.mp4 ||
    result?.video;

  // If result is array
  if (!downloadUrl && Array.isArray(result)) {
    for (const item of result) {
      const norm = normalizeResult(item, originalUrl);
      if (norm?.downloadUrl) {
        return { ...norm, title: norm.title === "Video" && item?.title ? item.title : norm.title };
      }
    }
  }

  // If it's an object with multiple possible urls
  if ((!downloadUrl || !isDirectMediaUrl(downloadUrl)) && typeof result === "object") {
    for (const key of Object.keys(result)) {
      const val = result[key];
      if (typeof val === "string" && val.startsWith("http")) {
        if (isDirectMediaUrl(val)) {
          downloadUrl = val;
          break;
        }
      } else if (typeof val === "object" && val !== null) {
        const norm = normalizeResult(val, originalUrl);
        if (norm?.downloadUrl) {
          return { title: norm.title === "Video" ? title : norm.title, thumbnail: norm.thumbnail || thumbnail, downloadUrl: norm.downloadUrl };
        }
      }
    }
  }

  if (!downloadUrl || !isDirectMediaUrl(downloadUrl)) return null;
  return { title: title === "Video" && originalUrl ? "Video" : title, thumbnail, downloadUrl };
}

// API endpoint for video download
app.post("/api/get-video", async (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Valid URL is required" });
  }

  const trimmedUrl = url.trim();
  console.log(`Fetching info for: ${trimmedUrl}`);

  const errors: string[] = [];

  try {
    // Strategy 1: YouTube - try vreden scraper first (often bypasses blocks)
    if (trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be")) {
      try {
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
          if (args[0] === "Converting error:") return;
          originalConsoleError.apply(console, args);
        };

        try {
          let result = await vreden.ytmp4(trimmedUrl, 1080);
          if (!result || !result?.download?.url) {
            result = await vreden.ytmp4(trimmedUrl, 720);
          }
          if (!result || !result?.download?.url) {
            result = await vreden.ytmp4(trimmedUrl, 360);
          }

          if (result && typeof result === "object") {
            const title = result?.metadata?.title || result?.data?.title || result?.title || "YouTube Video";
            const thumbnail = result?.metadata?.thumbnail || result?.data?.thumbnail || result?.thumbnail || "";
            const downloadUrl = result?.download?.url || result?.data?.url || result?.url;

            if (downloadUrl && downloadUrl.startsWith("http")) {
              console.error = originalConsoleError;
              return res.json({ title, thumbnail, downloadUrl });
            }
          }
        } finally {
          console.error = originalConsoleError;
        }
      } catch (e: any) {
        errors.push(`vreden: ${e.message}`);
      }

      // Strategy 1b: btch for youtube
      try {
        const resBtch = await (btch as any).youtube?.(trimmedUrl);
        const norm = normalizeResult(resBtch, trimmedUrl);
        if (norm?.downloadUrl) {
          return res.json(norm);
        }
        errors.push("btch.youtube: no direct url");
      } catch (e: any) {
        errors.push(`btch.youtube: ${e.message}`);
      }
    }

    // Strategy 2: Instagram - try multiple libs
    if (trimmedUrl.includes("instagram.com")) {
      const igStrategies = [
        async () => (btch as any).igdl?.(trimmedUrl),
        async () => (btch as any).instagram?.(trimmedUrl),
        async () => (allmedia as any).igdl?.(trimmedUrl),
        async () => (allmedia as any).instagram?.(trimmedUrl),
        async () => snapsave(trimmedUrl),
        async () => (nayan as any).alldown?.(trimmedUrl),
        async () => (nayan as any).instagram?.(trimmedUrl),
      ];

      for (const strat of igStrategies) {
        try {
          const r = await strat();
          const norm = normalizeResult(r, trimmedUrl);
          if (norm?.downloadUrl) {
            return res.json(norm);
          }
        } catch (e: any) {
          errors.push(`ig-strat: ${e.message?.substring(0, 80)}`);
        }
      }
    }

    // Strategy 3: Try other platform-specific libs (tiktok, facebook, twitter etc)
    try {
      const resBtchAll = await (btch as any).all?.(trimmedUrl);
      const norm = normalizeResult(resBtchAll, trimmedUrl);
      if (norm?.downloadUrl) {
        return res.json(norm);
      }
    } catch (e: any) {
      errors.push(`btch.all: ${e.message?.substring(0, 80)}`);
    }

    try {
      const resNayan = await (nayan as any).alldown?.(trimmedUrl);
      const norm = normalizeResult(resNayan, trimmedUrl);
      if (norm?.downloadUrl) {
        return res.json(norm);
      }
    } catch (e: any) {
      errors.push(`nayan.alldown: ${e.message?.substring(0, 80)}`);
    }

    try {
      const resAllmedia = await (allmedia as any).dl?.(trimmedUrl) || await (allmedia as any).download?.(trimmedUrl) || await (allmedia as any).all?.(trimmedUrl);
      const norm = normalizeResult(resAllmedia, trimmedUrl);
      if (norm?.downloadUrl) {
        return res.json(norm);
      }
    } catch (e: any) {
      errors.push(`allmedia: ${e.message?.substring(0, 80)}`);
    }

    // Strategy 4: Universal yt-dlp as last resort
    try {
      const output = await youtubedl(trimmedUrl, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        format: "bestvideo*+bestaudio/best",
        mergeOutputFormat: "mp4",
        youtubeSkipDashManifest: true,
        addHeader: [
          "referer:" + new URL(trimmedUrl).origin,
          "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        ],
      });

      const videoData = output as any;
      const title = videoData.title || "Video";
      const thumbnail = videoData.thumbnail || videoData.thumbnails?.[0]?.url || "";

      let downloadUrl = videoData.url;

      if (!downloadUrl && videoData.formats && videoData.formats.length > 0) {
        const sortedFormats = videoData.formats
          .filter((f: any) => f.url && !f.url.includes("manifest") && f.vcodec !== "none" && f.acodec !== "none")
          .sort((a: any, b: any) => {
            const heightA = a.height || 0;
            const heightB = b.height || 0;
            if (heightB !== heightA) return heightB - heightA;
            const tbrA = a.tbr || 0;
            const tbrB = b.tbr || 0;
            return tbrB - tbrA;
          });

        downloadUrl = sortedFormats[0]?.url || videoData.formats.find((f: any) => f.url && f.ext === "mp4")?.url || videoData.formats.find((f: any) => f.url)?.url;
      }

      if (!downloadUrl && videoData.requested_formats && videoData.requested_formats.length > 0) {
        const combined = videoData.requested_formats.find((f: any) => f.url);
        if (combined?.url) downloadUrl = combined.url;
      }

      if (downloadUrl && downloadUrl.startsWith("http")) {
        return res.json({ title, thumbnail, downloadUrl });
      }
    } catch (e: any) {
      errors.push(`yt-dlp: ${e.message?.substring(0, 100)}`);
    }

    // If everything failed, provide fallback links for better UX
    if (trimmedUrl.includes("instagram.com")) {
      return res.status(200).json({
        title: "Instagram Video",
        thumbnail: "",
        downloadUrl: `https://snapinsta.app/`,
        isFallback: true
      });
    } else if (trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be")) {
      return res.status(200).json({
        title: "YouTube Video",
        thumbnail: "",
        downloadUrl: `https://loader.to/api/button/?url=${encodeURIComponent(trimmedUrl)}&f=1080`,
        isFallback: true
      });
    } else if (trimmedUrl.includes("tiktok.com")) {
      return res.status(200).json({
        title: "TikTok Video",
        thumbnail: "",
        downloadUrl: `https://ssstik.io/`,
        isFallback: true
      });
    } else if (trimmedUrl.includes("facebook.com") || trimmedUrl.includes("fb.watch")) {
      return res.status(200).json({
        title: "Facebook Video",
        thumbnail: "",
        downloadUrl: `https://fdown.net/`,
        isFallback: true
      });
    } else if (trimmedUrl.includes("twitter.com") || trimmedUrl.includes("x.com")) {
      return res.status(200).json({
        title: "X Video",
        thumbnail: "",
        downloadUrl: `https://savetweetvid.com/`,
        isFallback: true
      });
    } else {
      // Try a generic fallback
      return res.status(200).json({
        title: "Video",
        thumbnail: "",
        downloadUrl: `https://cobalt.tools/`,
        isFallback: true
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to process the link.", isBlocked: true, originalUrl: trimmedUrl });
  }
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;