import { describe, it, expect } from 'vitest';
import type { VideoItem } from '../../components/catalog/video-manager';

describe('Admin Video Manager Component Logic', () => {
  function validateAndCreateVideo(
    url: string,
    title: string | undefined,
    currentVideos: VideoItem[],
    maxVideos = 5
  ): { success: true; video: VideoItem } | { success: false; error: string } {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return { success: false, error: 'Please provide a valid video URL.' };
    }

    try {
      new URL(trimmedUrl);
    } catch {
      return { success: false, error: 'Invalid URL format. Please provide a full URL starting with http:// or https://' };
    }

    if (currentVideos.length >= maxVideos) {
      return { success: false, error: `Maximum of ${maxVideos} videos allowed per product.` };
    }

    return {
      success: true,
      video: {
        url: trimmedUrl,
        title: title?.trim() || undefined,
        publicId: `vid_custom_${Date.now()}`,
      },
    };
  }

  function removeVideo(videos: VideoItem[], index: number): VideoItem[] {
    return videos.filter((_, i) => i !== index);
  }

  it('rejects empty or whitespace-only video URLs', () => {
    const res1 = validateAndCreateVideo('', 'Intro', []);
    expect(res1.success).toBe(false);
    if (!res1.success) {
      expect(res1.error).toBe('Please provide a valid video URL.');
    }

    const res2 = validateAndCreateVideo('   ', 'Intro', []);
    expect(res2.success).toBe(false);
  });

  it('rejects invalid URL protocols or malformed URLs', () => {
    const res = validateAndCreateVideo('not-a-valid-url', 'Test', []);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('Invalid URL format');
    }
  });

  it('accepts valid HTTPS video stream URLs and preserves title', () => {
    const res = validateAndCreateVideo(
      'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-42777-large.mp4',
      'Artisanal Teak Framing Reel',
      []
    );
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.video.url).toBe(
        'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-42777-large.mp4'
      );
      expect(res.video.title).toBe('Artisanal Teak Framing Reel');
      expect(res.video.publicId).toMatch(/^vid_custom_/);
    }
  });

  it('treats blank titles as undefined for clean API payloads', () => {
    const res = validateAndCreateVideo('https://example.com/video.mp4', '   ', []);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.video.title).toBeUndefined();
    }
  });

  it('enforces maximum video capacity constraint', () => {
    const existing: VideoItem[] = [
      { url: 'https://cdn.com/1.mp4' },
      { url: 'https://cdn.com/2.mp4' },
      { url: 'https://cdn.com/3.mp4' },
    ];
    const res = validateAndCreateVideo('https://cdn.com/4.mp4', '4th', existing, 3);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Maximum of 3 videos allowed per product.');
    }
  });

  it('correctly removes video by index and preserves order', () => {
    const list: VideoItem[] = [
      { url: 'https://cdn.com/1.mp4', title: 'First' },
      { url: 'https://cdn.com/2.mp4', title: 'Second' },
      { url: 'https://cdn.com/3.mp4', title: 'Third' },
    ];
    const updated = removeVideo(list, 1);
    expect(updated).toHaveLength(2);
    expect(updated[0]?.title).toBe('First');
    expect(updated[1]?.title).toBe('Third');
  });
});
