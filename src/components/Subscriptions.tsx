'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PaymentModal, { type PaymentData } from './PaymentModal';

// UI metadata mapped by plan index (order from API: cheapest first)
const UI_META = [
  {
    badge: null,
    accent: '#e2e8f0',
    borderSel: 'rgba(226,232,240,0.6)',
    glowSel: 'rgba(226,232,240,0.15)',
  },
  {
    badge: '🔥 MOST POPULAR',
    accent: '#c40d0d',
    borderSel: 'rgba(200, 15, 15, 0.7)',
    glowSel: 'rgba(199, 15, 15, 0.18)',
  },
  {
    badge: '⭐ BEST VALUE',
    accent: '#c084fc',
    borderSel: 'rgba(192,132,252,0.6)',
    glowSel: 'rgba(192,132,252,0.15)',
  },
  {
    badge: '💎 BEST DEAL',
    accent: '#fbbf24',
    borderSel: 'rgba(251,191,36,0.6)',
    glowSel: 'rgba(251,191,36,0.15)',
  },
];

interface ApiPlan {
  id: number;
  name: string;
  price: number;
  original_price: number;
  duration_days: number;
  description: string;
}

interface Plan extends ApiPlan {
  badge: string | null;
  duration: string;
  accent: string;
  borderSel: string;
  glowSel: string;
}

function formatDuration(days: number): string {
  if (days >= 365) return `${Math.round(days / 365)} Year`;
  if (days >= 30)
    return `${Math.round(days / 30)} Month${Math.round(days / 30) > 1 ? 's' : ''}`;
  return `${days} Days`;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const router = useRouter();
  const sel = plans.find((p) => p.id === selected) ?? null;

  useEffect(() => {
    // Check subscription via API (cookie-based auth)
    fetch('/api/user/profile')
      .then(async (r) => {
        if (r.status === 401) {
          // Token invalid/expired — force re-login
          await fetch('/api/auth/logout', { method: 'POST' });
          localStorage.removeItem('mr_mobile');
          localStorage.removeItem('mr_pending_plan');
          window.location.href = '/auth';
          return;
        }
        const data = await r.json();
        if (data.success && data.data.plan_name && data.data.sub_status === 'active') {
          setIsSubscribed(true);
        }
      })
      .catch(() => setIsSubscribed(false));

    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const mapped: Plan[] = data.data.map((p: ApiPlan, i: number) => ({
            ...p,
            duration: formatDuration(p.duration_days),
            ...(UI_META[i] ?? UI_META[UI_META.length - 1]),
          }));
          setPlans(mapped);
          setSelected(mapped[1]?.id ?? mapped[0]?.id ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('mr_mobile');
    localStorage.removeItem('mr_pending_plan');
    window.location.href = '/auth';
  };

  const handlePay = async () => {
    setError('');

    if (!selected) {
      setError('Please select a plan first.');
      return;
    }

    setPaying(true);
    try {
      const getCookie = (name: string) =>
        document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1] ?? '';

      const slug             = localStorage.getItem('mr_campaign') ?? '';
      const metaCampaignId   = localStorage.getItem('mr_meta_campaign_id') ?? '';
      const metaCampaignName = localStorage.getItem('mr_meta_campaign_name') ?? '';
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selected,
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
          campaignSlug: slug,
          metaCampaignId:   metaCampaignId   || null,
          metaCampaignName: metaCampaignName || null,
        }),
      });
      if (res.status === 401) {
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.clear();
        window.location.href = '/auth';
        return;
      }
      const data = await res.json();
      if (data.success) {
        setPaymentData(data.data);
        setPaying(false);
      } else {
        setError(data.message ?? 'Payment failed. Try again.');
        setPaying(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setPaying(false);
    }
  };

  return (
    <main className="relative h-[100dvh] overflow-x-hidden pb-20 text-white">
      {paymentData && (
        <PaymentModal data={paymentData} onCloseAction={() => { setPaymentData(null); setPaying(false); }} />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700;900&display=swap');
        .pcard {
          transition: transform .3s cubic-bezier(.34,1.4,.64,1), box-shadow .3s ease, border-color .3s ease;
          cursor: pointer;
          user-select: none;
        }
          @keyframes durationPulse {
  0%,100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06);
  }
}

.duration-badge {
  animation: durationPulse 2s ease-in-out infinite;
}
        .pcard:hover:not(.psel) { transform: translateY(-6px); }
        .pcard.psel { transform: translateY(-8px); }
        @keyframes fu { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fu .6s cubic-bezier(.22,1,.36,1) both; }
        @keyframes bp { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.06)} }
        .bp { animation: bp 1.8s ease-in-out infinite; }
        @keyframes shimBtn { 0%{background-position:200% center} 100%{background-position:-200% center} }
     .ctabtn {
  background: linear-gradient(
    90deg,
    #8b0000,
    #dc2626,
    #ef4444,
    #dc2626,
    #8b0000
  );
  background-size: 200% auto;
  animation: shimBtn 2.2s linear infinite;
}
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/image/bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.85) saturate(1.1)',
          }}
        />
        {/* Uniform dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0,0,0,0.25)',
          }}
        />
        {/* Bottom fade — very light */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 40%)',
          }}
        />
        {/* Pink glow center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(255,45,107,0.08) 0%, transparent 65%)',
          }}
        />
      </div>

      {/* Back to Home — only when already subscribed */}
      {isSubscribed && (
        <div className="fixed top-4 z-50" style={{ left: '1rem' }}>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/50 hover:text-white/90 transition-colors"
            style={{
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.1)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>
        </div>
      )}

      {/* Logout top-right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/50 hover:text-white/90 transition-colors"
          style={{
            background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.1)',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      <div className="relative z-10 h-[100dvh] flex flex-col items-center justify-center px-4 py-4">
        <div className="w-full max-w-xl">
          <h1
            className="hindi-title text-4xl sm:text-5xl font-black leading-tight text-center"
            style={{
              fontFamily: "'Tiro Devanagari Hindi', serif",
              color: '#ff1a1a',
              letterSpacing: '0.04em',
              textShadow: '3px 3px 8px rgba(0,0,0,0.5)',
            }}
          >
            गरमा गरम !
          </h1>
          {/* ── Header ── */}
          <div className="fu text-center mb-5" style={{ animationDelay: '0s' }}>
            {/* Decorative rule */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div
                className="h-px flex-1 max-w-[60px]"
                style={{
                  background:
                    'linear-gradient(to left, rgba(180,0,0,0.7), transparent)',
                }}
              />

              <span
                className="text-[9px] font-black tracking-[.25em] red-glow-sm"
                style={{ color: '#ff4444' }}
              >
                ✦ PREMIUM ✦
              </span>
              <div
                className="h-px flex-1 max-w-[60px]"
                style={{
                  background:
                    'linear-gradient(to right, rgba(180,0,0,0.7), transparent)',
                }}
              />
            </div>

            <h1
              className="text-[26px] sm:text-[32px] font-black leading-tight header-shadow"
              style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}
            >
              Unlock{' '}
              <span className="red-glow-lg" style={{ color: '#ff2020' }}>
                Premium Access
              </span>
            </h1>
            <p className="text-sm text-red-500 mt-0.5 tracking-wide">
              Unlimited content · Kabhi bhi · Cancel anytime
            </p>
          </div>

          {/* 2×2 Grid */}
          <div className="grid grid-cols-2 gap-3">
            {loading
              ? [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-[20px] overflow-hidden"
                    style={{
                      background: 'rgba(8, 0, 0, 0.72)',
                      border: '1px solid rgba(255,255,255,.08)',
                    }}
                  >
                    <div className="flex flex-col items-center px-3 py-3 gap-2">
                      <div
                        className="h-5 w-16 rounded-full animate-pulse"
                        style={{ background: 'rgba(255,255,255,.1)' }}
                      />
                      <div
                        className="h-9 w-24 rounded-lg animate-pulse"
                        style={{ background: 'rgba(255,255,255,.1)' }}
                      />
                      <div
                        className="h-4 w-20 rounded animate-pulse"
                        style={{ background: 'rgba(255,255,255,.08)' }}
                      />
                      <div
                        className="h-3 w-28 rounded animate-pulse"
                        style={{ background: 'rgba(255,255,255,.06)' }}
                      />
                      <div
                        className="h-5 w-5 rounded-full animate-pulse mt-1"
                        style={{ background: 'rgba(255,255,255,.07)' }}
                      />
                    </div>
                  </div>
                ))
              : null}
            {!loading &&
              plans.map((plan, i) => {
                const isSel = selected === plan.id;
                return (
                  <div
                    key={plan.id}
                    className="fu relative"
                    style={{ animationDelay: `${0.07 + i * 0.08}s` }}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="bp absolute -top-[14px] left-1/2 z-20 whitespace-nowrap pointer-events-none">
                        <span
                          className="px-3 py-[5px] rounded-full text-[9px] font-black tracking-[.14em] text-white"
                          style={{
                            background:
                              plan.id === 2
                                ? 'linear-gradient(90deg,#8b0000,#dc2626,#ef4444)'
                                : plan.id === 3
                                  ? 'linear-gradient(90deg,#7c3aed,#a855f7,#c084fc)'
                                  : 'linear-gradient(90deg,#92400e,#f59e0b,#fbbf24)',
                            boxShadow:
                              plan.id === 2
                                ? '0 3px 14px rgba(206, 9, 9, 0.45)'
                                : plan.id === 3
                                  ? '0 3px 14px rgba(168,85,247,.4)'
                                  : '0 3px 14px rgba(245,158,11,.4)',
                          }}
                        >
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Card */}
                    <div
                      onClick={() => setSelected(plan.id)}
                      className={`pcard${isSel ? ' psel' : ''} rounded-[18px] overflow-hidden`}
                      style={{
                        background: isSel
                          ? `linear-gradient(160deg, ${plan.glowSel} 0%, rgba(10,2,8,.82) 50%)`
                          : 'rgba(10,2,8,.65)',
                        border: isSel
                          ? `1.5px solid ${plan.borderSel}`
                          : '1px solid rgba(255,255,255,.08)',
                        boxShadow: isSel
                          ? `0 0 0 1px ${plan.borderSel}, 0 20px 48px -12px rgba(0,0,0,.85), 0 0 28px -8px ${plan.borderSel}`
                          : '0 8px 28px -10px rgba(0,0,0,.7)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      {/* Top accent line */}
                      <div
                        className="h-[2.5px] w-full"
                        style={{
                          background: isSel
                            ? `linear-gradient(90deg, transparent, ${plan.accent}, transparent)`
                            : 'transparent',
                          transition: 'background .3s ease',
                        }}
                      />

                      <div className="flex flex-col items-center text-center px-3 py-3 gap-1.5">
                        {/* Duration */}
                        <span
                          className="duration-badge text-[10px] font-black tracking-[.15em] px-3 py-1 rounded-full"
                          style={{
                            background: isSel
                              ? `linear-gradient(90deg, ${plan.accent}25, ${plan.accent}15)`
                              : 'rgba(255,255,255,.06)',
                            color: isSel ? '#fff' : 'rgba(255,255,255,.55)',
                            border: `1px solid ${
                              isSel
                                ? plan.accent + '60'
                                : 'rgba(255,255,255,.08)'
                            }`,
                            transition: 'all .3s ease',
                            textShadow: isSel
                              ? `0 0 10px ${plan.accent}, 0 0 20px ${plan.accent}80`
                              : '0 1px 3px rgba(0,0,0,.5)',
                            boxShadow: isSel
                              ? `0 0 15px ${plan.accent}40`
                              : '0 2px 6px rgba(0,0,0,.25)',
                          }}
                        >
                          ✦ {plan.duration}
                        </span>

                        {/* Price */}
                        <div className="flex flex-col items-center gap-1">
                          {plan.original_price > plan.price && (
                            <div className="flex items-center gap-1.5">
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: 'rgba(255,255,255,.45)',
                                  textDecoration: 'line-through',
                                  textDecorationColor: 'rgba(255,80,80,.7)',
                                  textDecorationThickness: '1.5px',
                                }}
                              >
                                ₹{plan.original_price}
                              </span>
                              <span
                                className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: isSel
                                    ? `${plan.accent}30`
                                    : 'rgba(220,38,38,.25)',
                                  color: isSel ? plan.accent : '#f87171',
                                  border: `1px solid ${isSel ? plan.accent + '50' : 'rgba(220,38,38,.3)'}`,
                                }}
                              >
                                {Math.round(
                                  ((plan.original_price - plan.price) /
                                    plan.original_price) *
                                    100,
                                )}
                                % OFF
                              </span>
                            </div>
                          )}
                          <div
                            className="font-black leading-none italic"
                            style={{
                              // fontFamily: "'Cormorant Garamond',Georgia,serif",
                              fontSize: 'clamp(24px,7vw,34px)',
                              color: isSel
                                ? plan.accent
                                : 'rgba(255,255,255,.82)',
                              transition: 'color .3s ease',
                              textShadow: isSel
                                ? `0 0 24px ${plan.accent}66`
                                : 'none',
                            }}
                          >
                            ₹{plan.price} /-
                          </div>
                        </div>

                        {/* Plan name */}
                        <div
                          className="text-[13px] font-bold"
                          style={{
                            fontFamily: "'Cormorant Garamond',Georgia,serif",
                            color: isSel
                              ? 'rgba(255,255,255,.9)'
                              : 'rgba(255,255,255,.55)',
                            transition: 'color .3s ease',
                          }}
                        >
                          {plan.name}
                        </div>

                        {/* Tagline */}
                        <p
                          className="plan-desc text-sm leading-snug font-semibold"
                          style={{
                            color: '#ffe5e5',
                            textShadow:
                              '0 2px 4px rgba(0,0,0,0.9), 0 0 12px rgba(255,0,0,0.5)',
                            letterSpacing: '0.03em',
                          }}
                        >
                          ✨ {plan.description}
                        </p>

                        {/* Checkmark */}
                        <div
                          className="mt-1 w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all duration-300"
                          style={{
                            background: isSel
                              ? plan.accent
                              : 'rgba(202, 12, 12, 0.07)',
                            border: isSel
                              ? 'none'
                              : '1.5px solid rgba(255,255,255,.12)',
                            transform: isSel ? 'scale(1)' : 'scale(0.85)',
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isSel ? '#000' : 'rgba(255,255,255,.25)'}
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Trust */}
          <div
            className="fu text-center mt-3"
            style={{ animationDelay: '.44s' }}
          >
            <p className="text-[10px] text-white/20 tracking-[.15em]">
              🔒 SECURE PAYMENT · INSTANT ACCESS · CANCEL ANYTIME
            </p>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 px-4 py-3"
        style={{
          background: 'rgba(3,0,3,.95)',
          borderTop: '1px solid rgba(255,255,255,.07)',
          backdropFilter: 'blur(28px)',
        }}
      >
        <div className="mx-auto max-w-xl flex flex-col gap-1.5">
          {error && (
            <p className="text-[11px] text-red-800 text-center">{error}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-white/28 mb-0.5">
                Selected Plan
              </p>
              <p className="text-[14px] font-black text-white leading-none flex items-center gap-1.5 flex-wrap">
                {sel?.name ?? '—'}{' '}
                {sel && sel.original_price > sel.price && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,.4)',
                      textDecoration: 'line-through',
                      textDecorationColor: 'rgba(255,80,80,.7)',
                      textDecorationThickness: '1.5px',
                    }}
                  >
                    ₹{sel.original_price}
                  </span>
                )}
                <span style={{ color: sel?.accent ?? '#c40d0d' }}>
                  ₹{sel?.price ?? ''}
                </span>
                <span className="text-[10px] font-normal text-white/28">
                  · {sel?.duration ?? ''}
                </span>
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="ctabtn shrink-0 px-7 py-3 rounded-full text-[13px] font-black text-white tracking-wide disabled:opacity-60"
              style={{
                boxShadow: '0 8px 24px -6px rgba(155, 8, 8, 0.55)',
                letterSpacing: '.05em',
              }}
            >
              {paying ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth={2.5}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeDasharray="31.4 31.4"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                '✦ Continue to pay'
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
