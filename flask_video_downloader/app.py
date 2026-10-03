from flask import Flask, request, jsonify, render_template
import yt_dlp
import traceback
import sys

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/get-video', methods=['POST'])
def get_video():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    # Advanced yt-dlp configuration to bypass basic blocks
    ydl_opts = {
        'format': 'best',
        'skip_download': True,
        'nocheckcertificate': True,
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        # Common user agent to mimic a real browser
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Sec-Fetch-Mode': 'navigate',
        },
        # Specifically targeting YouTube Android clients can sometimes bypass web blocks
        'extractor_args': {
            'youtube': {
                'player_client': ['android'],
            }
        }
    }

    try:
        print(f"[*] Processing URL: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            title = info.get('title', 'Unknown Title')
            thumbnail = info.get('thumbnail', '')
            
            # Find the best direct URL
            download_url = info.get('url')
            
            # If the direct URL isn't top-level (sometimes happens with specific formats), check formats
            if not download_url and 'formats' in info:
                # Filter out manifests, select formats with video and audio
                valid_formats = [
                    f for f in info['formats'] 
                    if f.get('url') and 'manifest' not in f.get('url', '')
                    and f.get('vcodec') != 'none' 
                    and f.get('acodec') != 'none'
                ]
                if valid_formats:
                    # best quality is usually at the end of the list
                    download_url = valid_formats[-1].get('url')
                else:
                    # Fallback to any valid URL
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
        # Print the exact error to the terminal for debugging
        error_msg = str(e)
        print(f"[!] yt-dlp Download Error:\n{error_msg}", file=sys.stderr)
        
        # Craft a user-friendly message based on the exception
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

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
