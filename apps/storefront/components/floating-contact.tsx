import React from 'react';
import { Phone } from 'lucide-react';

export function FloatingContact() {
  const phoneNumber = '+919663628302';
  const whatsappNumber = '919663628302'; // wa.me requires country code without +
  const whatsappMessage = encodeURIComponent(
    'Hello National Furniture & Interiors, I would like to inquire about bespoke furniture and interior design services.'
  );

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 flex flex-col gap-3 items-end pointer-events-auto">
      {/* WhatsApp Assistant Button */}
      <div className="relative group flex items-center">
        <span className="hidden sm:inline-block pointer-events-none absolute right-14 bg-[#0B0F17] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-white/10">
          Chat on WhatsApp
        </span>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-300 group"
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
            className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-300 group-hover:scale-110"
          >
            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
          </svg>
        </a>
      </div>

      {/* Phone Call Assistant Button */}
      <div className="relative group flex items-center">
        <span className="hidden sm:inline-block pointer-events-none absolute right-14 bg-[#0B0F17] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-white/10">
          Call Atelier (+91 96636 28302)
        </span>
        <a
          href={`tel:${phoneNumber}`}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-300 group"
          aria-label="Call National Furniture & Interiors"
        >
          <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 transition-transform duration-300 group-hover:scale-110 group-hover:text-black" />
        </a>
      </div>
    </div>
  );
}
