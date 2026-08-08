/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Download, Loader2, Video, AlertCircle, Image as ImageIcon } from "lucide-react";

export default function App() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoInfo, setVideoInfo] = useState<{
    title: string;
    thumbnail: string;
    downloadUrl: string;
    isFallback?: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");
    setVideoInfo(null);

    try {
      const response = await fetch("/api/get-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isBlocked) {
          // Provide an alternative web-based downloader if the backend is blocked
          const isInsta = url.includes("instagram.com");
          const isYt = url.includes("youtube.com") || url.includes("youtu.be");
          let fallbackUrl = "";
          
          if (isInsta) {
             fallbackUrl = `https://snapinsta.app/`;
          } else if (isYt) {
             fallbackUrl = `https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=1080`;
          }

          if (fallbackUrl) {
            setVideoInfo({
              title: isInsta ? "Instagram Download Ready" : "Video Download Ready",
              thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format&fit=crop", // placeholder thumbnail
              downloadUrl: fallbackUrl,
              isFallback: true
            });
            return; // Exit without throwing an error
          }
        }
        throw new Error(data.error || "Failed to fetch video info");
      }

      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-indigo-600 px-8 py-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Universal Video Downloader
          </h1>
          <p className="text-indigo-100">
            Download videos from YouTube, Instagram, and more using just the link.
          </p>
        </div>

        {/* Input Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="sr-only">
                Video URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video link here (e.g., https://youtube.com/watch?v=...)"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Get Download Link
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {/* Results Section */}
          {videoInfo && (
            <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              {videoInfo.thumbnail && (
                <div className="aspect-video w-full relative bg-black">
                  <img
                    src={videoInfo.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 text-lg mb-6 line-clamp-2" title={videoInfo.title}>
                  {videoInfo.title}
                </h3>
                
                {videoInfo.isFallback && !videoInfo.downloadUrl.includes('loader.to') && (
                  <p className="text-sm text-emerald-700 mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    Click the button below to continue and download your video.
                  </p>
                )}
                
                {videoInfo.isFallback && videoInfo.downloadUrl.includes('loader.to') ? (
                  <iframe src={videoInfo.downloadUrl} className="w-full h-[60px] border-none overflow-hidden" scrolling="no" />
                ) : (
                  <a
                    href={videoInfo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {videoInfo.isFallback ? "Continue to Download" : "Download Video"}
                  </a>
                )}
                
                <div className="text-sm text-left text-gray-700 mt-5 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    How to save to Gallery
                  </h4>
                  <ol className="list-decimal list-outside space-y-2 ml-4 text-gray-600">
                    <li>Tap the <strong>Download Video</strong> button above.</li>
                    <li>Wait for the download to finish in your browser.</li>
                    <li>Open your phone's <strong>Files</strong> or <strong>Downloads</strong> app.</li>
                    <li>Select the video, tap <strong>Share</strong>, and choose <strong>Save Video</strong> or <strong>Save to Gallery</strong>.</li>
                  </ol>
                  <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 italic">
                    Note: Web browsers (like Chrome or Safari) block websites from saving files directly into your Photos/Gallery for your security.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
