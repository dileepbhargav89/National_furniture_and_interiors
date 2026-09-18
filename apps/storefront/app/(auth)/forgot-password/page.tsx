'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@nfi/ui';
import { authService } from '../../../features/auth/services/auth.service';
import { Mail, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      if (res.success && res.data) {
        setSentMessage(res.data.message);
        if (res.data.resetToken) {
          // In development/demo, redirect directly to reset-password with token
          setTimeout(() => {
            router.push(`/reset-password?token=${encodeURIComponent(res.data!.resetToken!)}`);
          }, 1500);
        }
      } else {
        setError('Unable to initiate password reset. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your patron email address to receive password reset instructions.
        </p>
      </div>

      {sentMessage ? (
        <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <span>Instructions Dispatched</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">{sentMessage}</p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Registered Email</Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                placeholder="patron@residences.in"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#171717] py-2.5 font-medium text-amber-400 shadow-md transition-all hover:bg-[#262626] disabled:opacity-50"
          >
            {loading ? 'Sending Instructions...' : 'Send Reset Link'}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
