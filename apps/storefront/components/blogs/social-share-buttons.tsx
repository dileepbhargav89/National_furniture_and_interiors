'use client';

import { useState } from 'react';

interface SocialShareButtonsProps {
  title: string;
  url?: string;
}

export function SocialShareButtons({ title, url }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return url || window.location.href;
    }
    return url || '';
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareWhatsApp = () => {
    const shareText = encodeURIComponent(`${title} — Read on National Interiors: ${getShareUrl()}`);
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const shareTwitter = () => {
    const shareText = encodeURIComponent(`${title} via @NationalInteriors`);
    window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(getShareUrl())}`, '_blank');
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2 py-4">
      <span className="text-xs uppercase tracking-widest text-stone-400 font-medium mr-2">
        Share Chronicle:
      </span>

      {/* WhatsApp */}
      <button
        onClick={shareWhatsApp}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 hover:bg-[#25D366]/10 text-stone-600 hover:text-[#25D366] transition-colors"
        title="Share via WhatsApp"
        aria-label="Share via WhatsApp"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-1.927-.437-1.479-.611-2.433-2.124-2.508-2.224-.07-.1-1.002-1.332-1.002-2.54 0-1.208.636-1.802.862-2.048.226-.246.493-.308.658-.308.164 0 .328.002.472.009.153.007.359-.058.56.425.207.499.704 1.716.766 1.841.062.125.103.271.02.435-.082.164-.124.267-.246.411-.123.144-.258.322-.369.432-.123.123-.251.257-.108.503.143.247.636 1.049 1.365 1.698.939.837 1.732 1.096 1.978 1.219.246.123.391.103.535-.062.144-.164.617-.719.781-.965.164-.247.329-.205.555-.123.226.082 1.439.678 1.685.801.247.123.411.185.473.288.061.103.061.597-.083 1.002z"/>
        </svg>
      </button>

      {/* Twitter / X */}
      <button
        onClick={shareTwitter}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 hover:bg-black/10 text-stone-600 hover:text-black transition-colors"
        title="Share on X"
        aria-label="Share on X"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>

      {/* LinkedIn */}
      <button
        onClick={shareLinkedIn}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 hover:bg-[#0A66C2]/10 text-stone-600 hover:text-[#0A66C2] transition-colors"
        title="Share on LinkedIn"
        aria-label="Share on LinkedIn"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="relative inline-flex items-center gap-1.5 px-3 py-1 text-xs text-stone-600 hover:text-[#171717] bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
        title="Copy article link"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
      </button>
    </div>
  );
}
