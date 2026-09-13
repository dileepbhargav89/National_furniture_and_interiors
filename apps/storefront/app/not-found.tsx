import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] bg-[#FAF9F6] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C5A059]/10 text-[#C5A059] mb-2">
          <span className="font-serif text-2xl font-bold">404</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-[#8C7355] uppercase">
            Curated Horizon
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#171717] tracking-tight">
            Spatial Journey Paused
          </h1>
          <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            The architectural chronicle or furniture edition you are seeking may have been archived or relocated within our atelier.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3 bg-[#171717] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#C5A059] transition-colors rounded-sm text-center"
          >
            Explore Furniture
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-white border border-[#E5E0D8] text-[#171717] text-xs font-medium tracking-wider uppercase hover:border-[#C5A059] transition-colors rounded-sm text-center"
          >
            Return Home
          </Link>
        </div>

        <div className="pt-6 border-t border-[#EAE7E1] text-[11px] text-gray-500">
          Require custom architectural millwork?{' '}
          <Link href="/contact" className="text-[#8C7355] hover:text-[#171717] underline font-medium">
            Speak with our Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
