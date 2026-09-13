import Image from 'next/image';
import { Compass, Check } from 'lucide-react';

const CAPABILITIES = [
  {
    id: 'turnkey',
    badge: 'Residential Flagship',
    title: 'Full Home Turnkey Interiors',
    tagline: 'End-to-end design, factory fabrication, civil work, and 45-day move-in handover',
    description:
      'Our turnkey service covers everything from concept to completion for Bengaluru homes. We manage all false ceilings, modular kitchens, custom wardrobes, electrical and plumbing rerouting, architectural lighting, wall treatments, and final deep cleaning. You receive the keys to a completely finished home with zero contractor headaches.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
    points: [
      'Single-point project manager & dedicated senior architect',
      'Century 710 Club Prime BWP Marine Grade Plywood carcasses',
      'Integrated electrical layout, mood lighting & concealed wiring',
      '45-Day Handover Guarantee backed by ₹1,000/day delay compensation',
    ],
    ctaText: 'Explore Turnkey Packages',
    ctaHref: '#cost-estimator',
  },
  {
    id: 'commercial-office',
    badge: 'Commercial Architecture',
    title: 'Corporate Offices & Tech Innovation Workspaces',
    tagline: 'High-performance collaborative zones, acoustic phone pods, and executive boardrooms',
    description:
      'We design and execute modern commercial workspaces tailored for high-growth tech firms, venture studios, and corporate headquarters across Bengaluru (Outer Ring Road, Whitefield, Indiranagar). From acoustic double-glazed cabins and ergonomic desking to town hall breakout cafeterias and biometric security.',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1200&auto=format&fit=crop',
    points: [
      'Ergonomic workstation desking with concealed power & data cable races',
      'Soundproof executive boardrooms with integrated video conferencing tech',
      'High-NRC acoustic timber ceiling baffles & private focus booths',
      'Fast-track commercial handover (30 to 45 days) to minimize lease overlap',
    ],
    ctaText: 'Explore Workspace Portfolio',
    ctaHref: '#portfolio',
  },
  {
    id: 'restaurant-design',
    badge: 'Hospitality & F&B',
    title: 'Fine Dining Restaurants, Bistros & Cocktail Bars',
    tagline: 'Atmospheric dining design, custom curved bars, acoustic balance, and commercial kitchens',
    description:
      'Bengaluru’s competitive culinary scene demands unforgettable dining aesthetics and flawless operational flow. We design custom brass gantry cocktail bars, velvet banquet seating booths, commercial kitchen pass-throughs, mood dimming lighting, and outdoor garden pergolas built to handle high daily customer footfall.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    points: [
      'Custom solid teakwood & backlit quartzite cocktail bars',
      'Commercial grade velvet & leather upholstery (Martindale > 80,000)',
      'Acoustic sound dampening keeping dining volume under 65dB',
      'Commercial kitchen stainless steel workflow & HVAC exhaust integration',
    ],
    ctaText: 'View Restaurant Projects',
    ctaHref: '#portfolio',
  },
  {
    id: 'hotel-hospitality',
    badge: 'Hotels & Club Suites',
    title: 'Boutique Hotels & Luxury Guest Suites',
    tagline: 'Regal heritage suites, double-height reception lobbies, and turnkey resort millwork',
    description:
      'From boutique hotel suites in Sadashivanagar to luxury club lounges, we engineer bespoke hospitality interiors built for durability and prestige. We craft four-poster solid teakwood beds, luggage credenzas, soundproof entry doors, and hotel-grade vanities that withstand heavy guest turnover while delighting visitors.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
    points: [
      '12 to 50+ turnkey room fit-outs with uniform factory tolerances',
      'Solid CP Teakwood four-poster beds & luggage bench casework',
      'Acoustic soundproof suite entry doors (STC 42 rating)',
      'Keyless commercial RFID lock integration & energy saving master controls',
    ],
    ctaText: 'View Hotel Case Studies',
    ctaHref: '#portfolio',
  },
  {
    id: 'retail-design',
    badge: 'Retail & Visual Merchandising',
    title: 'Luxury Retail Shops & Fashion Showrooms',
    tagline: 'Museum-grade glass showcases, VIP trial lounges, and high-CRI lighting',
    description:
      'Designed to maximize average transaction value and visual allure. We build custom jewelry display casework in low-iron Optiwhite glass, illuminated white onyx billing counters, private VIP fitting salons with smart mirrors, and directional 98+ CRI track spotlighting that makes diamonds, silks, and luxury apparel gleam.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
    points: [
      'Optiwhite anti-reflective low-iron display cases with concealed LED bars',
      'Backlit translucent white onyx reception & cashier counters',
      'Private VIP bridal & haute-couture fitting lounges',
      'Reinforced concealed vault room & magnetic counter locks',
    ],
    ctaText: 'View Retail Showrooms',
    ctaHref: '#portfolio',
  },
  {
    id: 'space-planning',
    badge: 'Architectural Ergonomics',
    title: 'Space Planning & 3D VR Visualizations',
    tagline: 'Precision 2D floorplan schematics, acoustic zoning, and photorealistic 3D renders',
    description:
      'Before a single wooden plank is cut, our architects develop millimeter-accurate 2D layout drawings and 4K photorealistic 3D renders for both homes and commercial properties. You can virtually walk through your space, test circulation flow, evaluate natural ventilation, and review realistic lighting simulations in daylight and evening modes.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop',
    points: [
      'Comprehensive space measurement & architectural audit',
      '4K photorealistic 3D renders from multiple angles',
      'Virtual Reality (VR) headset walkthrough at our Indiranagar Studio',
      'Complete itemized Bill of Quantities (BOQ) with transparent pricing',
    ],
    ctaText: 'View 3D Project Samples',
    ctaHref: '#portfolio',
  },
  {
    id: 'custom-furniture',
    badge: 'Artisanal Bengaluru Workshop',
    title: 'Bespoke Solid Hardwood Furniture',
    tagline: 'Kiln-dried seasoned teakwood, brass inlays, and live-edge artisanal craftsmanship',
    description:
      'Unlike generic flat-pack modular assemblers, National Furniture & Interiors has roots as master woodcrafters since 1998. We handcraft bespoke solid CP Teakwood dining tables, executive conference desks, live-edge Sheesham credenzas, upholstered restaurant booths, and intricately carved Pooja Mandirs custom-sized to your exact dimensions.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop',
    points: [
      'Seasoned 100% Grade-A Central Province (CP) Teakwood & Sheesham',
      'Traditional mortise-and-tenon joinery built to last generations',
      'Custom fabric selection from D’Decor, Sarom, and pure Italian leathers',
      'Manufactured in our 40,000 sq.ft Peenya facility with zero middlemen markup',
    ],
    ctaText: 'Explore Handcrafted Pieces',
    ctaHref: '/products',
  },
];

export function CapabilitiesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-800 text-[12px] font-medium tracking-wide uppercase mb-4">
            <Compass size={13} className="text-[#8C7355]" />
            <span>Specialized Capabilities</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-light text-[#171717] tracking-tight mb-4">
            Residential, Commercial &amp; Hospitality Expertise
          </h2>
          <p className="text-stone-600 text-base md:text-lg leading-relaxed font-light">
            From turnkey luxury residences to high-energy bistros, corporate tech hubs, and boutique hotels, our team of architects and master craftsmen delivers state-of-the-art results across Bengaluru.
          </p>
        </div>

        <div className="space-y-24">
          {CAPABILITIES.map((cap, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={cap.id}
                id={cap.id}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-16 scroll-mt-28`}
              >
                {/* Image Container */}
                <div className="w-full lg:w-1/2">
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-xl border border-stone-200 bg-stone-100 group">
                    <Image
                      src={cap.image}
                      alt={cap.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-black/65 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {cap.badge}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="w-full lg:w-1/2">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#8C7355] font-semibold block mb-2">
                    {cap.badge}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-medium text-[#171717] mb-3 leading-tight">
                    {cap.title}
                  </h3>
                  <p className="text-sm font-medium text-stone-800 mb-3">
                    {cap.tagline}
                  </p>
                  <p className="text-xs md:text-sm text-stone-600 leading-relaxed mb-6 font-light">
                    {cap.description}
                  </p>

                  <ul className="space-y-2.5 mb-8">
                    {cap.points.map((pt) => (
                      <li key={pt} className="text-xs md:text-sm text-stone-700 flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={cap.ctaHref}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#171717] text-white hover:bg-black text-xs font-semibold tracking-wide uppercase transition-colors shadow-sm"
                  >
                    <span>{cap.ctaText}</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
