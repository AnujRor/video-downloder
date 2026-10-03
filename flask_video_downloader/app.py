from flask import Flask, request, jsonify
import yt_dlp
import traceback
import sys
import os

app = Flask(__name__)

@app.route('/api/get-video', methods=['POST'])
def get_video():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    # yt-dlp config for serverless environment
    ydl_opts = {
        'format': 'best',
        'skip_download': True,
        'nocheckcertificate': True,
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Sec-Fetch-Mode': 'navigate',
        },
        'extractor_args': {
            'youtube': {
                'player_client': ['android'],
            }
        },
    }

    try:
        print(f"[*] Processing URL: {url}", file=sys.stderr)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            title = info.get('title', 'Unknown Title')
            thumbnail = info.get('thumbnail', '')
            
            download_url = info.get('url')
            
            if not download_url and 'formats' in info:
                valid_formats = [
                    f for f in info['formats'] 
                    if f.get('url') and 'manifest' not in f.get('url', '')
                    and f.get('vcodec') != 'none' 
                    and f.get('acodec') != 'none'
                ]
                if valid_formats:
                    download_url = valid_formats[-1].get('url')
                else:
                    valid_formats = [f for f in info['formats'] if f.get('url')]
                    if valid_formats:
                        download_url = valid_formats[-1].get('url')
                        
            if not download_url:
                raise Exception("Could not extract a direct download URL from the video.")
                
            return jsonify({
                "title": title,
                "thumbnail": thumbnail,
                "downloadUrl": download_url
            })
            
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        print(f"[!] yt-dlp Download Error:\n{error_msg}", file=sys.stderr)
        
        user_message = "Failed to process the link."
        
        if "Sign in to confirm" in error_msg or "bot" in error_msg.lower():
            user_message = "YouTube blocked the request. Try passing cookies to yt-dlp."
        elif "Private video" in error_msg:
            user_message = "This video is private."
        elif "Video unavailable" in error_msg:
            user_message = "This video is unavailable or deleted."
        elif "Instagram API is not granting access" in error_msg or "login" in error_msg.lower():
            user_message = "Instagram requires login. Try passing cookies to yt-dlp."
        elif "not a valid URL" in error_msg.lower():
            user_message = "The provided URL is invalid or unsupported."
            
        return jsonify({"error": user_message}), 500
        
    except Exception as e:
        print(f"[!] Unexpected Error:\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

# Vercel expects the app to be importable
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))