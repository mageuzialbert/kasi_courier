'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CustomSMSPage() {
  const router = useRouter();
  const [phones, setPhones] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Split phones by comma and trim
    const phoneList = phones
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (phoneList.length === 0) {
      setResult({ success: false, message: 'Please enter at least one valid phone number.' });
      setLoading(false);
      return;
    }

    if (!message.trim()) {
      setResult({ success: false, message: 'Please enter a message.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/staff/notifications/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phones: phoneList,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true, message: data.message || 'SMS sent successfully!' });
        setPhones('');
        setMessage('');
      } else {
        setResult({ success: false, message: data.error || 'Failed to send SMS.' });
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setResult({ success: false, message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/staff/operations"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Custom SMS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Send manual SMS notifications to staff, clients, or businesses.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {result && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              result.success ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="font-medium text-sm">{result.message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="phones" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Phone Number(s)
              </label>
              <input
                id="phones"
                type="text"
                placeholder="e.g. +255712345678, +255789012345"
                value={phones}
                onChange={(e) => setPhones(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-shadow"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Separate multiple numbers with commas. Prefix with country code (e.g. +255).
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message Content
              </label>
              <div className="relative">
                <textarea
                  id="message"
                  placeholder="Type your SMS message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-shadow resize-none"
                  required
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {message.length} chars {(message.length > 160 ? `(~${Math.ceil(message.length / 160)} SMS)` : '')}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send SMS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
