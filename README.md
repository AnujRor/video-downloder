# Universal Video Downloader

A web app that turns a video link into a direct download link. Paste a video URL and download the video from YouTube, Instagram, and other supported sites.

## What It Does

- Takes a video link as input and returns a direct download link
- Supports YouTube, Instagram, and other yt-dlp compatible sites
- Shows the video title and thumbnail before downloading
- Tries different video qualities automatically for YouTube (1080p, then 720p, then 360p)
- Offers an alternative download option when a platform blocks the server
- Includes a simple guide for saving the video to the phone gallery

## How It Is Built

**Frontend**
- React with TypeScript
- Vite as the build tool
- Tailwind CSS for styling
- lucide-react for icons

**Backend**
- Node.js with Express for the API
- yt-dlp (through youtube-dl-exec) to extract video links
- A YouTube scraper library to bypass some platform blocks
- A Flask + yt-dlp backend as an alternative service

## Project Structure

```text
video-downloder/
│
├── src/
│   ├── App.tsx            # Main user interface
│   ├── main.tsx           # React entry point
│   └── index.css          # Styles
│
├── server.ts              # Node/Express backend
├── index.html             # Page entry point
├── vite.config.ts         # Build configuration
├── vercel.json            # Deployment configuration
├── metadata.json          # App metadata
│
└── flask_video_downloader/
    ├── app.py             # Flask backend using yt-dlp
    ├── requirements.txt   # Python dependencies
    └── templates/         # Flask page template
```

## How It Works

1. The user pastes a video link in the interface.
2. The app sends the link to its backend.
3. The backend extracts the video title, thumbnail, and direct download link.
4. The app shows the result with a download button.
5. If the platform blocks the server, the app provides another way to download.

## Note

Cloud servers are often blocked by YouTube and Instagram, so running the app locally on a personal machine works best.
