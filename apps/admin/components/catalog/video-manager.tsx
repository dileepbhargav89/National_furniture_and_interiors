'use client';

import React, { useState } from 'react';
import { NfiButton } from '@/components/ui/nfi-button';

export interface VideoItem {
  url: string;
  title?: string | undefined;
  publicId?: string | undefined;
}

export interface VideoManagerProps {
  videos: VideoItem[];
  onChange: (videos: VideoItem[]) => void;
  maxVideos?: number;
}

export function VideoManager({
  videos,
  onChange,
  maxVideos = 5,
}: VideoManagerProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleAddVideo = () => {
    setError('');
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) {
      setError('Please provide a valid video URL.');
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError('Invalid URL format. Please provide a full URL starting with http:// or https://');
      return;
    }

    if (videos.length >= maxVideos) {
      setError(`Maximum of ${maxVideos} videos allowed per product.`);
      return;
    }

    const newVideo: VideoItem = {
      url: trimmedUrl,
      title: videoTitle.trim() || undefined,
      publicId: `vid_custom_${Date.now()}`,
    };

    onChange([...videos, newVideo]);
    setVideoUrl('');
    setVideoTitle('');
  };

  const handleRemoveVideo = (index: number) => {
    const updated = videos.filter((_, i) => i !== index);
    onChange(updated);
    if (previewIdx === index) {
      setPreviewIdx(null);
    } else if (previewIdx !== null && previewIdx > index) {
      setPreviewIdx(previewIdx - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Videos List */}
      {videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((vid, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-white text-xs"
              style={{ borderColor: 'var(--nfi-border)' }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-800 border"
                  style={{ borderColor: 'var(--nfi-border)' }}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="truncate">
                  <p className="font-medium text-gray-900 truncate">
                    {vid.title || `Product Video Clip #${idx + 1}`}
                  </p>
                  <p className="text-gray-400 font-mono text-[10px] truncate max-w-sm">
                    {vid.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setPreviewIdx(previewIdx === idx ? null : idx)}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {previewIdx === idx ? 'Close Preview' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(idx)}
                  className="px-2.5 py-1 text-xs font-medium rounded text-red-600 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Inline Video Player Preview */}
          {previewIdx !== null && videos[previewIdx] && (
            <div
              className="p-3 rounded-lg border bg-stone-900 text-white space-y-2"
              style={{ borderColor: 'var(--nfi-border)' }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {videos[previewIdx].title || `Video #${previewIdx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewIdx(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="aspect-video w-full rounded overflow-hidden bg-black">
                <video
                  src={videos[previewIdx].url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="py-6 text-center text-xs text-gray-400 border border-dashed rounded-lg"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          No product videos configured yet. Add video streams (.mp4) below to showcase real craftsmanship.
        </div>
      )}

      {/* Add Video Form */}
      {videos.length < maxVideos && (
        <div
          className="p-4 rounded-lg border bg-gray-50/70 space-y-3"
          style={{ borderColor: 'var(--nfi-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Add Video Stream / Reel
            </span>
            <span className="text-[11px] text-gray-400">
              {videos.length}/{maxVideos} added
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Video URL (Direct .mp4 or CDN Stream) *
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://cdn.domain.com/.../product-video.mp4"
                className="w-full px-3 py-1.5 text-xs rounded border bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                style={{ borderColor: 'var(--nfi-border)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Video Title / Caption (Optional)
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. 360 Artisanal Detail & Leather Grain"
                className="w-full px-3 py-1.5 text-xs rounded border bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                style={{ borderColor: 'var(--nfi-border)' }}
              />
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <div className="flex justify-end">
            <NfiButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddVideo}
            >
              + Add Video Asset
            </NfiButton>
          </div>
        </div>
      )}
    </div>
  );
}
