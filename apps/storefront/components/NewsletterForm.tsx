'use client';

import { useState } from 'react';
import { CmsService } from '@nfi/api-client';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await CmsService.subscribeNewsletter(email, 'footer');
      setStatus('success');
      setMessage('Thanks for subscribing!');
      setEmail('');
    } catch (err: unknown) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Something went wrong.';
      setMessage(errorMessage);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider">Subscribe to our Newsletter</h4>
      <p className="text-sm text-gray-500 mb-4">Get the latest news on design trends and exclusive offers.</p>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
        <input
          type="email"
          placeholder="Your email address"
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
