import React from 'react';
import { Phone } from 'lucide-react';

export function FloatingContact() {
  const phoneNumber = '+919663628302';
  const whatsappNumber = '919663628302'; // wa.me requires country code without +
  const whatsappMessage = encodeURIComponent(
    'Hello National Furniture & Interiors, I would like to inquire about bespoke furniture and interior design services.',
  );

  return (
    <div className="animate-float pointer-events-auto fixed bottom-20 right-4 z-30 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* WhatsApp Assistant Button */}
      <div className="group relative flex items-center">
        <span className="pointer-events-none absolute right-16 hidden translate-x-2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0B0F17]/95 px-3.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:inline-block">
          Chat on WhatsApp
        </span>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="pulse-radar-ring group flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:shadow-2xl active:scale-95 sm:h-14 sm:w-14"
          aria-label="Chat on WhatsApp with Atelier Concierge"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110 sm:h-7 sm:w-7"
          >
            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
          </svg>
        </a>
      </div>

      {/* Phone Call Assistant Button */}
      <div className="group relative flex items-center">
        <span className="pointer-events-none absolute right-16 hidden translate-x-2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0B0F17]/95 px-3.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:inline-block">
          Call Atelier (+91 96636 28302)
        </span>
        <a
          href={`tel:${phoneNumber}`}
          className="group flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E0D8] bg-white/95 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:shadow-2xl active:scale-95 sm:h-14 sm:w-14"
          aria-label="Call National Furniture & Interiors"
        >
          <Phone className="h-5 w-5 text-[#5C2D10] transition-transform duration-300 group-hover:scale-110 group-hover:text-[#E07020] sm:h-6 sm:w-6" />
        </a>
      </div>
    </div>
  );
}
