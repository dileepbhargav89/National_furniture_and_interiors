import Link from 'next/link';
import { Phone, MapPin, ShieldCheck } from 'lucide-react';
import { Logo } from './header/logo';

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden border-t pb-12 pt-16 text-white/90"
      style={{ backgroundColor: 'var(--nfi-brown-dark)', borderColor: 'rgba(224,112,32,0.2)' }}
    >
      {/* Decorative ambient gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 100% 100%, #E07020 0%, transparent 60%)',
        }}
      />

      <div className="container relative z-10 mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand Atelier & Heritage */}
          <div className="lg:col-span-4">
            <Logo variant="footer" className="mb-6" />

            <p className="mb-5 max-w-sm text-xs font-light leading-relaxed text-neutral-400 sm:text-[13px]">
              Established in 1998, National Furniture &amp; Interiors is Bengaluru&apos;s premier
              bespoke furniture atelier and turnkey interior architecture studio. Direct from our
              40,000 sq.ft master workshop to discerning residences across Karnataka and South
              India. Every commission is handcrafted from seasoned Burma teak, American walnut, and
              top-grain Italian leather.
            </p>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--nfi-orange)' }}>
              <ShieldCheck className="h-4 w-4" style={{ color: 'var(--nfi-orange)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                10-Year Structural Frame Warranty Included
              </span>
            </div>
          </div>

          {/* Column 2: Architectural Collections */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4
              className="mb-5 font-serif text-sm font-medium uppercase tracking-widest"
              style={{ color: 'var(--nfi-orange)' }}
            >
              Bespoke Suites
            </h4>
            <ul className="space-y-3 text-xs font-light text-neutral-400 sm:text-[13px]">
              <li>
                <Link
                  href="/products?category=living-room"
                  className="transition-colors hover:text-white"
                >
                  Living &amp; Modular Sofas
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=dining"
                  className="transition-colors hover:text-white"
                >
                  Sculptural Dining Tables
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=bedroom"
                  className="transition-colors hover:text-white"
                >
                  Teakwood Bedroom Suites
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=office"
                  className="transition-colors hover:text-white"
                >
                  Executive Study &amp; Desks
                </Link>
              </li>
              <li>
                <Link href="/collections" className="transition-colors hover:text-white">
                  Curated Lookbooks
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="transition-colors hover:text-white">
                  Completed Projects
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Patron Services */}
          <div className="lg:col-span-2">
            <h4
              className="mb-5 font-serif text-sm font-medium uppercase tracking-widest"
              style={{ color: 'var(--nfi-orange)' }}
            >
              Patron Care
            </h4>
            <ul className="space-y-3 text-xs font-light text-neutral-400 sm:text-[13px]">
              <li>
                <Link href="#design-consultation" className="transition-colors hover:text-white">
                  Book 3D Design Audit
                </Link>
              </li>
              <li>
                <Link href="/our-story" className="transition-colors hover:text-white">
                  Our 28-Year Heritage
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Flagship Experience Studio
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Custom Dimension Enquiries
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy &amp; DPDP Compliance
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Studio Location & Concierge */}
          <div className="lg:col-span-4">
            <h4
              className="mb-5 font-serif text-sm font-medium uppercase tracking-widest"
              style={{ color: 'var(--nfi-orange)' }}
            >
              Experience Studio
            </h4>
            <div className="mb-4 space-y-2 text-xs font-light leading-relaxed text-neutral-400 sm:text-[13px]">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#D4AF37]" />
                <p>
                  Sec-02, 24th Main Rd, opp. Purva Fairmont Apartments, BDA Layout, HSR Layout,
                  Bengaluru, Karnataka 560102
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--nfi-orange)' }} />
                <a
                  href="tel:+919663628302"
                  className="font-medium text-white transition-colors hover:text-white"
                  style={{ color: 'var(--nfi-orange-light)' }}
                >
                  +91 96636 28302
                </a>
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-400">Mon–Sun 10:00 AM – 8:30 PM</span>
              </div>
            </div>

            {/* Embedded Studio Map Frame */}
            <div
              className="h-32 w-full overflow-hidden rounded-lg shadow-inner"
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(224,112,32,0.2)',
              }}
            >
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
        <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 text-xs text-neutral-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} National Furniture &amp; Interiors. All rights reserved.
            Mastercrafted in Bengaluru, India.
          </p>
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
