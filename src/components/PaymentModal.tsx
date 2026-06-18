'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface PaymentData {
  txnId: string;
  paymentUrl: string;
  qrCode: string | null;
  qrString: string | null;
  amount: number;
  expiresAt?: string | null;
}

const UPI_APPS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    logo: '/upi/gpay.png',
    getUrl: (u: string) => u.replace('upi://pay', 'tez://upi/pay'),
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    logo: '/upi/phonepe.png',
    getUrl: (u: string) => u.replace('upi://', 'phonepe://'),
  },
  {
    id: 'paytm',
    label: 'Paytm',
    logo: '/upi/paytm.png',
    getUrl: (u: string) => u.replace('upi://', 'paytmmp://'),
  },
  {
    id: 'bhim',
    label: 'BHIM UPI',
    logo: '/upi/bhim.png',
    getUrl: (u: string) => u,
  },
];

function calcSecs(expiresAt: string | null | undefined) {
  if (!expiresAt) return 0;
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
  );
}

function useCountdown(expiresAt: string | null | undefined) {
  const [secs, setSecs] = useState(() => calcSecs(expiresAt));
  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setSecs(calcSecs(expiresAt)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return secs;
}

export default function PaymentModal({
  data,
  onCloseAction,
}: {
  data: PaymentData;
  onCloseAction: () => void;
}) {
  const [status, setStatus] = useState<'pending' | 'checking' | 'success'>(
    'pending',
  );
  const secs = useCountdown(data.expiresAt);
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  const expired = secs === 0 && !!data.expiresAt;
  const qrValue = data.qrString ?? null;

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txnId: data.txnId }),
        });
        const json = await res.json();
        if (json.success) {
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/';
          }, 1800);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [data.txnId]);

  async function handleVerify() {
    setStatus('checking');
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txnId: data.txnId }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1800);
      } else {
        setStatus('pending');
      }
    } catch {
      setStatus('pending');
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(18,4,26,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow:
            '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* ── HEADER BAR ── */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Masti Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #c40d0d, #ff2020)',
              }}
            >
              <span className="text-white font-black text-[11px] tracking-tight">
                M
              </span>
            </div>
            <div>
              <p className="text-white font-black text-[13px] leading-none tracking-wide">
                MASTI
              </p>
              <p
                className="text-[9px] leading-none tracking-[0.2em] uppercase"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Premium
              </p>
            </div>
          </div>

          {/* Close */}
          {status !== 'success' && (
            <button
              onClick={onCloseAction}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
              style={{
                color: 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* ── SUCCESS ── */}
        {status === 'success' ? (
          <div className="p-10 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1.5px solid rgba(34,197,94,0.5)',
                boxShadow: '0 0 32px -8px rgba(34,197,94,0.5)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth={2.5}
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              Payment Successful!
            </h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Your subscription is now active 🎉
            </p>
          </div>
        ) : (
          <div className="p-5">
            {/* ── AMOUNT + TIMER ── */}
            <div
              className="rounded-xl p-4 mb-5 flex items-center justify-between"
              style={{
                background: 'rgba(196,13,13,0.1)',
                border: '1px solid rgba(196,13,13,0.22)',
              }}
            >
              <div>
                <p
                  className="text-[9px] uppercase tracking-[0.35em] mb-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Total Amount
                </p>
                <p className="text-3xl font-black text-white leading-none">
                  ₹{data.amount}
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  UPI Payment
                </p>
              </div>
              {data.expiresAt && (
                <div className="flex flex-col items-end gap-1">
                  <p
                    className="text-[9px] uppercase tracking-[0.25em]"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {expired ? 'Status' : 'Expires in'}
                  </p>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{
                      background: expired
                        ? 'rgba(239,68,68,0.1)'
                        : 'rgba(0,0,0,0.4)',
                      border: `1px solid ${expired ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                      style={{ background: expired ? '#ef4444' : '#22c55e' }}
                    />
                    <span
                      className="font-mono text-sm font-bold"
                      style={{ color: expired ? '#ef4444' : '#fff' }}
                    >
                      {expired
                        ? 'Expired'
                        : `${mins}:${remSecs.toString().padStart(2, '0')}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!expired ? (
              <>
                {/* ── QR CODE ── */}
                {qrValue && (
                  <div className="flex flex-col items-center mb-5">
                    <div
                      className="p-3 rounded-2xl mb-3"
                      style={{
                        background: '#fff',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                      }}
                    >
                      <QRCodeSVG
                        value={qrValue}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#111111"
                        level="M"
                      />
                    </div>
                    <p
                      className="text-[11px] text-center"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      Scan with Google Pay, PhonePe, or any UPI app
                    </p>
                  </div>
                )}

                {/* ── DIVIDER ── */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex-1 h-px"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  />
                  <span
                    className="text-[9px] uppercase tracking-[0.35em]"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    Or open in app
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  />
                </div>

                {/* ── UPI APP GRID ── */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {UPI_APPS.map((app) => (
                    <a
                      key={app.id}
                      href={app.getUrl(qrValue ?? data.paymentUrl)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 active:scale-95"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={app.logo}
                        alt={app.label}
                        className="w-8 h-8 rounded-lg shrink-0 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-white">
                          {app.label}
                        </p>
                        <p
                          className="text-[9px]"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          Tap to open
                        </p>
                      </div>
                    </a>
                  ))}
                </div>

                {/* ── ANY UPI APP ── */}
                <a
                  href={data.paymentUrl}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-all duration-150 active:scale-95 mb-4"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/upi/upi-other.jpg"
                    alt="UPI"
                    className="w-8 h-8 rounded-lg shrink-0 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">
                      Any UPI App
                    </p>
                    <p
                      className="text-[9px]"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Opens app chooser
                    </p>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </a>
              </>
            ) : (
              <div className="text-center py-8 mb-4">
                <p className="text-sm mb-2" style={{ color: '#ef4444' }}>
                  Payment link has expired
                </p>
                <button
                  onClick={onCloseAction}
                  className="text-xs tracking-widest uppercase px-5 py-2 rounded-full transition-colors"
                  style={{
                    border: '1px solid rgba(196,13,13,0.4)',
                    color: '#c40d0d',
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ── CONFIRM BUTTON ── */}
            <div
              className="pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}
            >
              <button
                onClick={handleVerify}
                disabled={status === 'checking'}
                className="w-full py-3.5 rounded-xl text-xs tracking-widest uppercase font-bold transition-all duration-200 disabled:opacity-50"
                style={{
                  background: 'rgba(196,13,13,0.1)',
                  border: '1px solid rgba(196,13,13,0.3)',
                  color: '#ff4444',
                }}
              >
                {status === 'checking' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        strokeDasharray="31.4 31.4"
                      />
                    </svg>
                    Verifying payment...
                  </span>
                ) : (
                  '✓  I Have Paid'
                )}
              </button>
            </div>

            {/* ── SECURITY FOOTER ── */}
            <p
              className="text-center mt-3 text-[9px] tracking-[0.2em] uppercase"
              style={{ color: 'rgba(255,255,255,0.15)' }}
            >
              🔒 Secured · Powered by UPI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
