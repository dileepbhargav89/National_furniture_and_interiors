import Link from 'next/link';
import { Phone, MapPin, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="pt-16 pb-12 relative overflow-hidden text-white/90 border-t" style={{ backgroundColor: 'var(--nfi-brown-dark)', borderColor: 'rgba(224,112,32,0.2)' }}>
      {/* Decorative ambient gradient */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #E07020 0%, transparent 60%)' }}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-[1400px] relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          
          {/* Column 1: Brand Atelier & Heritage */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <span className="text-white font-bold text-xl px-2.5 py-1 tracking-tighter rounded-sm" style={{ backgroundColor: 'var(--nfi-orange)' }}>
                NFI.
              </span>
              <span className="text-white font-serif tracking-widest text-sm uppercase">
                National Furniture &amp; Interiors
              </span>
            </Link>

            <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed max-w-sm font-light mb-5">
              Established in 1998, National Furniture &amp; Interiors is Bengaluru&apos;s premier bespoke furniture atelier and turnkey interior architecture studio. Direct from our 40,000 sq.ft master workshop to discerning residences across Karnataka and South India. Every commission is handcrafted from seasoned Burma teak, American walnut, and top-grain Italian leather.
            </p>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--nfi-orange)' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--nfi-orange)' }} />
              <span className="font-semibold tracking-wider uppercase text-[11px]">
                10-Year Structural Frame Warranty Included
              </span>
            </div>
          </div>
          
          {/* Column 2: Architectural Collections */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-serif font-medium mb-5 text-sm uppercase tracking-widest" style={{ color: 'var(--nfi-orange)' }}>
              Bespoke Suites
            </h4>
            <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-400 font-light">
              <li>
                <Link href="/products?category=living-room" className="hover:text-white transition-colors">
                  Living &amp; Modular Sofas
                </Link>
              </li>
              <li>
                <Link href="/products?category=dining" className="hover:text-white transition-colors">
                  Sculptural Dining Tables
                </Link>
              </li>
              <li>
                <Link href="/products?category=bedroom" className="hover:text-white transition-colors">
                  Teakwood Bedroom Suites
                </Link>
              </li>
              <li>
                <Link href="/products?category=office" className="hover:text-white transition-colors">
                  Executive Study &amp; Desks
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-white transition-colors">
                  Curated Lookbooks
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="hover:text-white transition-colors">
                  Completed Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Patron Services */}
          <div className="lg:col-span-2">
            <h4 className="font-serif font-medium mb-5 text-sm uppercase tracking-widest" style={{ color: 'var(--nfi-orange)' }}>
              Patron Care
            </h4>
            <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-400 font-light">
              <li>
                <Link href="#design-consultation" className="hover:text-white transition-colors">
                  Book 3D Design Audit
                </Link>
              </li>
              <li>
                <Link href="/our-story" className="hover:text-white transition-colors">
                  Our 28-Year Heritage
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Flagship Experience Studio
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Custom Dimension Enquiries
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy &amp; DPDP Compliance
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Studio Location & Concierge */}
          <div className="lg:col-span-4">
            <h4 className="font-serif font-medium mb-5 text-sm uppercase tracking-widest" style={{ color: 'var(--nfi-orange)' }}>
              Experience Studio
            </h4>
            <div className="text-xs sm:text-[13px] text-neutral-400 font-light leading-relaxed mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p>
                  Sec-02, 24th Main Rd, opp. Purva Fairmont Apartments, BDA Layout, HSR Layout, Bengaluru, Karnataka 560102
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nfi-orange)' }} />
                <a href="tel:+919663628302" className="hover:text-white transition-colors font-medium text-white" style={{ color: 'var(--nfi-orange-light)' }}>
                  +91 96636 28302
                </a>
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-400">Mon–Sun 10:00 AM – 8:30 PM</span>
              </div>
            </div>

            {/* Embedded Studio Map Frame */}
            <div className="w-full h-32 rounded-lg overflow-hidden shadow-inner" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(224,112,32,0.2)' }}>
              <iframe
                src="https://maps.google.com/maps?q=National%20Furniture%20%26%20Interiors%20-%20Furniture%20store%20in%20HSR%20Layout&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="National Furniture & Interiors HSR Layout Flagship Studio"
              />
            </div>
          </div>
          
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} National Furniture &amp; Interiors. All rights reserved. Mastercrafted in Bengaluru, India.</p>
          <div className="flex items-center gap-6">
            <span className="text-neutral-400">Direct Workshop Pricing</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">Zero Middleman Markup</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">Pan-India White-Glove Handover</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
