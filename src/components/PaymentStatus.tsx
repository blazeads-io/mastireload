'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentStatusPage() {
  const params = useSearchParams();
  const status = params.get('status');
  const txnId = params.get('txnid') ?? params.get('txnId') ?? '';
  const isSuccess = status === 'success';

  const [state, setState] = useState<'loading' | 'success' | 'failed'>(
    'loading',
  );
  const [msg, setMsg] = useState('Payment confirm ho raha hai...');

  useEffect(() => {
    if (!isSuccess) {
      setTimeout(() => {
        setState('failed');
        setMsg('Payment failed ya cancel ho gaya.');
      }, 0);
      setTimeout(() => {
        window.location.href = '/subscription';
      }, 2500);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txnId }),
        });
        const data = await res.json();

        if (data.success) {
          localStorage.removeItem('mr_campaign');
          localStorage.removeItem('mr_meta_campaign_id');
          localStorage.removeItem('mr_meta_campaign_name');
          setState('success');
          setMsg('Payment successful! Subscription active ho gayi 🎉');
          setTimeout(() => {
            window.location.href = '/';
          }, 1800);
        } else {
          setState('failed');
          setMsg('Payment verify nahi ho saka. Support se contact karo.');
          setTimeout(() => {
            window.location.href = '/subscription';
          }, 3000);
        }
      } catch {
        setState('failed');
        setMsg('Network error. Please try again.');
        setTimeout(() => {
          window.location.href = '/subscription';
        }, 3000);
      }
    };

    verify();
  }, [isSuccess, txnId]);

  const color =
    state === 'success'
      ? '#22c55e'
      : state === 'failed'
        ? '#ef4444'
        : '#FF2D6B';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        {state === 'loading' ? (
          <div
            className="w-16 h-16 rounded-full border-2 border-t-transparent mx-auto mb-5 animate-spin"
            style={{ borderColor: `${color} transparent ${color} ${color}` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: `${color}18`,
              border: `1.5px solid ${color}66`,
              boxShadow: `0 0 28px -8px ${color}`,
            }}
          >
            {state === 'success' ? (
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
        )}

        <p className="text-white text-lg font-bold mb-1">{msg}</p>
        <p className="text-white/35 text-sm">
          {state === 'loading'
            ? 'Thoda wait karo...'
            : state === 'success'
              ? 'Home page pe redirect ho raha hai'
              : 'Subscription page pe ja raha hai'}
        </p>
      </div>
    </div>
  );
}
