import { AdminLoginForm } from '../../../features/auth/components/login-form';
import { Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="shadow-xs inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8C7355]">
          <Sparkles className="h-3 w-3 text-[#C5A059]" />
          <span>Executive Atelier Gateway</span>
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          National Furniture &amp; Interiors
        </h1>
        <p className="max-w-sm text-xs leading-relaxed text-stone-500">
          Sign in to access architectural design projects, turnkey CRM dossiers, and studio command
          operations.
        </p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
