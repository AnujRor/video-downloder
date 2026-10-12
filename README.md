# Universal Video Downloader

A web app that extracts direct download links for videos from YouTube, Instagram, and other supported sites using just a link.

## Features

- Paste a video URL and get a direct download link
- Supports YouTube, Instagram, and other yt-dlp compatible sites
- Shows video title and thumbnail before download
- Automatic quality fallback (1080p → 720p → 360p) for YouTube
- Built-in fallback links when the server IP is blocked by the platform
- Simple, responsive UI with a "How to save to Gallery" guide for mobile users

## Tech Stack

**Frontend**
- React 19
- Vite
- TypeScript
- Tailwind CSS
- lucide-react (icons)

**Backend (Node)**
- Express
- youtube-dl-exec / yt-dlp
- @vreden/youtube_scraper (YouTube scraper that bypasses some blocks)

**Backend (Python / Flask)**
- Flask
- yt-dlp

## Project Structure

```text
video-downloder/
│
├── src/
│   ├── App.tsx            # Main React UI
│   ├── main.tsx           # React entry point
│   └── index.css          # Tailwind styles
│
├── server.ts              # Node/Express backend API
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
├── vercel.json            # Deployment config (frontend + Flask API)
├── metadata.json          # App metadata
│
└── flask_video_downloader/
    ├── app.py             # Flask backend using yt-dlp
    ├── requirements.txt   # Python dependencies
    └── templates/         # Flask frontend template
```

## How It Works

1. The user pastes a video link in the frontend.
2. The frontend sends the link to the `/api/get-video` endpoint.
3. The backend extracts the video info (title, thumbnail, direct URL) using yt-dlp or a YouTube scraper.
4. The frontend displays the title, thumbnail, and a download button.
5. If the platform blocks the server (common on cloud IPs), the app provides an alternative download link.

## API Endpoints

### `POST /api/get-video`

Request body:

```json
{ "url": "https://youtube.com/watch?v=..." }
```

Response:

```json
{
  "title": "Video title",
  "thumbnail": "https://...",
  "downloadUrl": "https://..."
}
```

### `GET /health` (Flask backend)

Returns the service health status.

## Running Locally

### Frontend + Node Backend

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   ```

### Flask Backend (Optional)

1. Navigate to the Flask folder:

   ```bash
   cd flask_video_downloader
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the app:

   ```bash
   python app.py
   ```

5. Open [http://127.0.0.1:5000](http://127.0.0.1:5000).

## Important Note

Cloud servers (AWS, GCP, Vercel, etc.) are aggressively blocked by YouTube and Instagram. Running this app **locally on your own machine** (using your residential IP) gives the best results. If a platform still requests cookies, yt-dlp can be configured to use your browser cookies.

## License

Apache-2.0
