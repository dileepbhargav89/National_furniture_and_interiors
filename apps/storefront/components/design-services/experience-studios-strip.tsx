import { MapPin, Navigation, Factory, Clock, Phone } from 'lucide-react';

interface StudioLocation {
  name: string;
  type: string;
  address: string;
  phone: string;
  hours: string;
  mapQuery: string;
}

const STUDIOS: StudioLocation[] = [
  {
    name: 'Indiranagar Flagship Studio',
    type: 'Bespoke Experience Center',
    address: '100 Feet Road, Near CMH Junction, Indiranagar, Bengaluru 560038',
    phone: '+91 80 4123 4567',
    hours: 'Open 7 Days · 10:00 AM – 8:30 PM',
    mapQuery: 'Indiranagar+100+Feet+Road+Bengaluru',
  },
  {
    name: 'Whitefield Design Center',
    type: 'Luxury Apartment Gallery',
    address: 'ITPL Main Road, Opp. Prestige Shantiniketan, Whitefield, Bengaluru 560066',
    phone: '+91 80 4123 4568',
    hours: 'Open 7 Days · 10:00 AM – 8:30 PM',
    mapQuery: 'ITPL+Main+Road+Whitefield+Bengaluru',
  },
  {
    name: 'HSR Layout Studio',
    type: 'Material & Hardware Library',
    address: '27th Main Road, Sector 4, HSR Layout, Bengaluru 560102',
    phone: '+91 80 4123 4569',
    hours: 'Open 7 Days · 10:00 AM – 8:30 PM',
    mapQuery: '27th+Main+HSR+Layout+Bengaluru',
  },
  {
    name: 'Peenya Manufacturing Plant',
    type: '40,000 sq.ft Automated Factory',
    address: 'Peenya Industrial Area, Phase 2, Near Metro Station, Bengaluru 560058',
    phone: '+91 80 4123 4570',
    hours: 'Client Factory Tours: By Appointment',
    mapQuery: 'Peenya+Industrial+Area+Bengaluru',
  },
];

export function ExperienceStudiosStrip() {
  return (
    <section className="py-20 bg-[#171717] text-white">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold mb-3">
            Physical Presence &amp; Infrastructure
          </p>
          <h2 className="text-3xl md:text-5xl font-serif font-light tracking-tight text-white mb-4">
            Visit Our Bengaluru Studios &amp; Factory
          </h2>
          <p className="text-stone-300 text-sm md:text-base font-light leading-relaxed">
            Experience tactile material samples, German soft-close fittings, and full-scale room mockups in person. Walk through our 40,000 sq.ft state-of-the-art factory where your furniture is crafted.
          </p>
        </div>

        {/* Studio Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {STUDIOS.map((studio) => (
            <div
              key={studio.name}
              className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 flex flex-col justify-between hover:border-[#8C7355] transition-all group"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-amber-400 mb-4 group-hover:bg-[#8C7355] group-hover:text-white transition-colors">
                  {studio.type.includes('Factory') ? <Factory size={18} /> : <MapPin size={18} />}
                </div>

                <span className="text-[11px] font-medium tracking-wider uppercase text-amber-400/90 block mb-1">
                  {studio.type}
                </span>
                <h3 className="text-lg font-serif font-medium text-white mb-2">{studio.name}</h3>
                <p className="text-xs text-stone-400 leading-relaxed mb-4">{studio.address}</p>

                <div className="space-y-1 text-xs text-stone-300 border-t border-stone-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-stone-500 shrink-0" />
                    <span>{studio.hours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-stone-500 shrink-0" />
                    <span>{studio.phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-stone-800/80 flex items-center justify-between">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${studio.mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-medium transition-colors"
                >
                  <Navigation size={12} />
                  <span>Get Directions</span>
                </a>

                <a
                  href="#book-consultation"
                  className="text-xs text-stone-400 hover:text-white transition-colors"
                >
                  Book Visit →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Factory Direct Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border border-stone-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#8C7355]/30 border border-[#8C7355] flex items-center justify-center text-amber-300 shrink-0">
              <Factory size={24} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white">The Direct Bengaluru Factory Advantage</h4>
              <p className="text-xs text-stone-300 mt-0.5 max-w-xl">
                By manufacturing all modular cabinetry, solid teak furniture, and laser-banded shutters directly in our Bengaluru factory, you bypass third-party contractor markups, saving 25%–30% on your turnkey project.
              </p>
            </div>
          </div>

          <a
            href="#book-consultation"
            className="shrink-0 px-6 py-3 rounded-xl bg-[#8C7355] hover:bg-[#786144] text-white text-xs font-semibold tracking-wide uppercase transition-colors shadow-sm"
          >
            Schedule Factory &amp; Studio Tour
          </a>
        </div>
      </div>
    </section>
  );
}
