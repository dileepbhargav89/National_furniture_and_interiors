import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="min-h-[75vh] bg-[#0C0D0E] flex items-center justify-center px-4 py-16 text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
          <span className="font-serif text-xl font-bold">404</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-[#C5A059] uppercase">
            Operations Portal
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl text-white tracking-tight">
            Dashboard Hub Not Found
          </h1>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            The requested admin module or resource does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-[#C5A059] text-black text-xs font-semibold tracking-wider uppercase hover:bg-[#D4AF37] transition-colors rounded-sm text-center"
          >
            Command Dashboard
          </Link>
          <Link
            href="/analytics"
            className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold tracking-wider uppercase hover:border-neutral-700 transition-colors rounded-sm text-center"
          >
            Analytics Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
