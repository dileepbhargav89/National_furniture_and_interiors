import { ShieldAlert, Award, CheckSquare, Clock, ArrowRight } from 'lucide-react';

const GUARANTEES = [
  {
    icon: Clock,
    title: '45-Day Handover or We Pay Rent',
    description: 'We commit to strict 45-day on-time project completion. If we delay, we pay you ₹1,000/day for every single day delayed.',
  },
  {
    icon: Award,
    title: '10-Year BWP Marine Warranty',
    description: '100% Century Club Prime BWP 710 marine plywood carcasses protected with an official 10-year anti-termite certificate.',
  },
  {
    icon: CheckSquare,
    title: '146-Point Quality Inspection',
    description: '5-stage factory audit covering laser edge-banding seal, Blum runner glide cycles, moisture resistance, and hardware fitment.',
  },
  {
    icon: ShieldAlert,
    title: 'Zero Cost Escalation Guarantee',
    description: 'The price you sign on your itemized BOQ is the exact price you pay. No sudden midway surprises or contractor markups.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Design Consultation & Lifestyle Audit',
    description: 'Meet our senior architects at our Indiranagar/Whitefield experience studio or at your apartment for comprehensive space measurements and aesthetic mapping.',
  },
  {
    step: '02',
    title: 'Photorealistic 3D & VR Walkthrough',
    description: 'Experience your future home in 4K virtual reality. Touch tactile laminate, natural veneer, and quartz samples from our Bengaluru material library.',
  },
  {
    step: '03',
    title: 'Precision Factory Fabrication',
    description: 'Your modular cabinetry and artisanal teakwood furniture are fabricated in our 40,000 sq.ft Bengaluru plant with automated European CNC machinery.',
  },
  {
    step: '04',
    title: '45-Day White-Glove Installation & Move-In',
    description: 'Installed by factory-trained master technicians in just 10-14 on-site days. Deep cleaned, quality certified, and handed over ready for life.',
  },
];

export function GuaranteeAndProcess() {
  return (
    <div>
      {/* ── Guarantees Section ── */}
      <section className="py-20 bg-stone-50 border-b border-stone-200">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8C7355] font-semibold mb-3">
              Uncompromising Peace of Mind
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-light text-[#171717] tracking-tight mb-4">
              The Bengaluru Homeowner Assurances
            </h2>
            <p className="text-stone-600 text-sm md:text-base font-light leading-relaxed">
              We eliminate the stress, delays, and contractor horror stories commonly associated with home renovation in Bengaluru.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GUARANTEES.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.title}
                  className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C7355] flex items-center justify-center mb-4">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base font-serif font-medium text-stone-900 mb-2">{g.title}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{g.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Process Steps Section ── */}
      <section className="py-24 bg-[#171717] text-white">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold mb-3">
              Transparent Roadmap
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-light text-white tracking-tight mb-4">
              Our 4-Step Design Journey
            </h2>
            <p className="text-stone-300 text-sm md:text-base font-light leading-relaxed">
              From the initial sketch to the moment you unlock your front door, here is how we bring your dream home to life in 45 days.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.step} className="relative flex flex-col justify-between">
                <div>
                  <span className="text-5xl font-serif font-light text-stone-700 block mb-3">
                    {step.step}
                  </span>
                  <h3 className="text-base font-semibold text-white mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <a
              href="#book-consultation"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#8C7355] text-white hover:bg-[#776044] text-xs font-semibold tracking-wide uppercase transition-colors shadow-md group"
            >
              <span>Start Step 1: Book Your Consultation</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
