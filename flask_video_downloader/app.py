from flask import Flask, request, jsonify
import traceback
import sys
import threading

app = Flask(__name__)

def extract_video(url, result):
    try:
        import yt_dlp

        ydl_opts = {
            'format': 'best',
            'skip_download': True,
            'nocheckcertificate': True,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'socket_timeout': 8,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            'extractor_args': {
                'youtube': {'player_client': ['android', 'web']}
            },
            'retries': 1,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            title = info.get('title', 'Unknown Title')
            thumbnail = info.get('thumbnail', '')
            download_url = info.get('url')

            if not download_url and 'formats' in info:
                valid = [
                    f for f in info['formats']
                    if f.get('url') and 'manifest' not in f.get('url', '')
                    and f.get('vcodec') != 'none'
                    and f.get('acodec') != 'none'
                ]
                if not valid:
                    valid = [f for f in info['formats'] if f.get('url')]
                if valid:
                    download_url = valid[-1].get('url')

            if download_url:
                result['ok'] = {
                    'title': title,
                    'thumbnail': thumbnail,
                    'downloadUrl': download_url
                }
            else:
                result['error'] = 'Could not extract download URL.'
    except Exception as e:
        result['error'] = str(e)


@app.route('/api/get-video', methods=['POST'])
def get_video():
    data = request.get_json(silent=True)
    if not data or not data.get('url'):
        return jsonify({"error": "URL is required"}), 400

    url = data['url']
    print(f"[*] Processing: {url}", file=sys.stderr)

    result = {}
    t = threading.Thread(target=extract_video, args=(url, result))
    t.daemon = True
    t.start()
    t.join(timeout=55)

    if 'ok' in result:
        return jsonify(result['ok'])

    if 'error' in result:
        msg = result['error']
        if "Sign in to confirm" in msg or "bot" in msg.lower():
            user_msg = "Video site blocked the request. Try a different video."
        elif "Private video" in msg:
            user_msg = "This video is private."
        elif "Video unavailable" in msg:
            user_msg = "Video unavailable or deleted."
        elif "Unsupported URL" in msg:
            user_msg = "Unsupported URL. Try a different link."
        elif "empty media response" in msg or "cookies" in msg.lower():
            user_msg = "This site requires login. Try a YouTube link instead."
        elif "HTTP Error 4" in msg or "HTTP Error 5" in msg:
            user_msg = "The video site is not responding. Try again later."
        else:
            user_msg = "Could not process this link. Try a different URL."
        return jsonify({"error": user_msg}), 500

    return jsonify({"error": "Request timed out. Try a different video."}), 504


@app.route('/health', methods=['GET'])
def health():
    try:
        import yt_dlp
        return jsonify({"status": "ok", "yt_dlp": True})
    except ImportError:
        return jsonify({"status": "ok", "yt_dlp": False})
