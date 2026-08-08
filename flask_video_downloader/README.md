# Video Downloader (Flask + yt-dlp)

This is a robust, production-ready Python application that uses Flask and `yt-dlp` to extract direct video download links. It is designed with advanced configurations to bypass basic bot protections from platforms like YouTube and Instagram.

## Folder Structure
```text
flask_video_downloader/
│
├── app.py                  # Main Flask application with advanced yt-dlp logic
├── requirements.txt        # Python dependencies
└── templates/
    └── index.html          # Frontend UI built with Tailwind CSS via CDN
```

## Step-by-Step Instructions to Run Locally

### 1. Prerequisites
Ensure you have Python 3 installed on your computer. You can download it from [python.org](https://www.python.org/downloads/).

### 2. Open Terminal and Navigate to the Folder
Open your terminal (Command Prompt or PowerShell on Windows, Terminal on Mac/Linux) and navigate to the directory where you saved these files:
```bash
cd path/to/flask_video_downloader
```

### 3. Create a Virtual Environment (Recommended)
Creating a virtual environment keeps the project's dependencies separate from your system python packages.
```bash
python -m venv venv
```
Activate the virtual environment:
- **Windows:** `venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

### 4. Install the Required Libraries
Use `pip` to install Flask and yt-dlp using the provided requirements file:
```bash
pip install -r requirements.txt
```

### 5. Run the Application
Start the Flask development server:
```bash
python app.py
```

### 6. Access the Web App
Open your web browser and go to:
[http://127.0.0.1:5000](http://127.0.0.1:5000)

## Important Note Regarding Blocks
Cloud servers (AWS, GCP, etc.) are aggressively blocked by YouTube and Instagram. Running this code **locally on your own PC** (using your residential IP) is the best way to bypass these restrictions. 

The `yt-dlp` configuration inside `app.py` includes custom User-Agents and android client fallbacks, but if YouTube eventually requests cookies, you will need to add them. You can do this by adding `'cookiesfrombrowser': ('chrome',)` to the `ydl_opts` dictionary inside `app.py` if running locally.
