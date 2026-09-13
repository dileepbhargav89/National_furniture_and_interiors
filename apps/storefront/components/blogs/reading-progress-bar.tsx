'use client';

import { useEffect, useState } from 'react';

export function ReadingProgressBar() {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const updateScrollCompletion = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setCompletion(
          Number((currentProgress / scrollHeight).toFixed(3)) * 100
        );
      }
    };

    window.addEventListener('scroll', updateScrollCompletion, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollCompletion);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-[3px] z-50 bg-stone-200/50 pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(completion)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-[#C5A059] transition-all duration-150 ease-out shadow-[0_0_8px_rgba(197,160,89,0.5)]"
        style={{ width: `${completion}%` }}
      />
    </div>
  );
}
