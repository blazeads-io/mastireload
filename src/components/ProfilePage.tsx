'use client';

import { useState, useEffect, useLayoutEffect } from 'react';

interface UserProfile {
  mobile: string;
  plan_name: string | null;
  plan_price: number | null;
  duration_days: number | null;
  end_date: string | null;
  sub_status: string | null;
  days_left: number | null;
}

const ACCENT = '#FF2D6B';
const CACHE_KEY = 'mr_profile';

function formatExpiry(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(days: number | null) {
  if (!days) return null;
  if (days >= 365) return `${Math.round(days / 365)} Year`;
  if (days >= 30)
    return `${Math.round(days / 30)} Month${Math.round(days / 30) > 1 ? 's' : ''}`;
  return `${days} Days`;
}

function readCache(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCache(data: UserProfile) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export default function ProfilePage() {
  const [showLogout, setShowLogout] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState('');
  const [fromCache, setFromCache] = useState(false);

  // ✅ useLayoutEffect — browser paint se PEHLE chalta hai (synchronous flush)
  // Server pe nahi chalta, sirf client pe — isliye SSR mismatch nahi hoga
  // Agar cache hai → skeleton kabhi user ko dikhta hi nahi
  useLayoutEffect(() => {
    const cached = readCache();
    if (cached) {
      setProfile(cached);
      setLoading(false);
      setFromCache(true);
    }
  }, []);

  useEffect(() => {
    const getCookie = (name: string) =>
      document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1] ?? '';

    const mobile = localStorage.getItem('mr_mobile') || getCookie('mr_mob');

    if (!localStorage.getItem('mr_mobile') && mobile) {
      localStorage.setItem('mr_mobile', mobile);
    }

    // Cache se data aa gaya → network call skip
    if (profile !== null) return;

    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.data);
          writeCache(data.data);
        } else {
          setProfile({
            mobile: mobile ?? '',
            plan_name: null,
            plan_price: null,
            duration_days: null,
            end_date: null,
            sub_status: null,
            days_left: null,
          });
        }
      })
      .catch(() => {
        setProfile({
          mobile: mobile ?? '',
          plan_name: null,
          plan_price: null,
          duration_days: null,
          end_date: null,
          sub_status: null,
          days_left: null,
        });
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
    clearCache();
    window.location.href = '/auth';
  };

  const handleRenew = async () => {
    setPayErr('');
    const userId = localStorage.getItem('mr_user_id');
    if (!userId) { window.location.href = '/auth'; return; }
    setPaying(true);
    try {
      const plansRes = await fetch('/api/plans');
      const plansData = await plansRes.json();
      const plan = plansData.data?.[0];
      if (!plan) { setPayErr('Plan not found. Try again.'); setPaying(false); return; }

      const getCookie = (name: string) =>
        document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1] ?? '';

      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          planId: plan.id,
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.data.paymentUrl;
      } else {
        setPayErr(data.message ?? 'Payment failed. Try again.');
        setPaying(false);
      }
    } catch {
      setPayErr('Network error. Please try again.');
      setPaying(false);
    }
  };

  const hasSub = profile?.plan_name && profile?.sub_status === 'active';

  const anim = (delay: string) =>
    fromCache
      ? {}
      : { animation: `fu .55s cubic-bezier(.22,1,.36,1) ${delay} both` };

  return (
    <main
      className="relative min-h-[100dvh] text-white overflow-x-hidden"
      style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}
    >
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700;900&display=swap');
        @keyframes fu { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/image/bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom,rgba(0,0,0,.7),rgba(0,0,0,.95))',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-sm px-5 pt-6 pb-10">
        {/* Back to Home */}
        <div style={{ ...anim('0s'), opacity: fromCache ? 1 : 0 }}>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 mb-8 text-[12px] font-semibold"
            style={{ color: 'rgba(255,255,255,.4)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </a>
        </div>

        {/* Avatar */}
        <div
          className="flex flex-col items-center mb-10"
          style={{ ...anim('.05s'), opacity: fromCache ? 1 : 0 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{
              background: 'linear-gradient(135deg,#be123c,#FF2D6B)',
              boxShadow: '0 0 28px -4px rgba(255,45,107,.65)',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <span
            className="text-[11px] font-bold tracking-[.18em] uppercase"
            style={{ color: 'rgba(255,255,255,.3)' }}
          >
            My Account
          </span>
        </div>

        {/* Mobile Number */}
        <div
          className="rounded-[16px] px-5 py-4 mb-4"
          style={{
            ...anim('.08s'),
            opacity: fromCache ? 1 : 0,
            background: 'rgba(255,255,255,.09)',
            border: '1px solid rgba(255,255,255,.13)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/30 mb-1">
            Mobile Number
          </p>
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,.5)"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M10 17h4" />
            </svg>
            {loading ? (
              <div className="animate-pulse h-5 w-40 rounded-lg bg-white/10" />
            ) : (
              <span className="text-[16px] font-bold text-white tracking-wide">
                +91 {profile?.mobile ?? '—'}
              </span>
            )}
          </div>
        </div>

        {/* Current Subscription */}
        <div
          className="rounded-[16px] overflow-hidden mb-4"
          style={{
            ...anim('.15s'),
            opacity: fromCache ? 1 : 0,
            border: `1px solid ${ACCENT}33`,
            boxShadow: `0 0 32px -12px ${ACCENT}44`,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            className="h-[2px]"
            style={{
              background: `linear-gradient(90deg,transparent,${ACCENT},transparent)`,
            }}
          />
          <div
            className="px-5 py-4"
            style={{ background: 'rgba(12,2,10,.88)' }}
          >
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/30 mb-3">
              Current Subscription
            </p>

            {loading ? (
              <div className="space-y-2">
                <div className="animate-pulse h-6 w-36 rounded-lg bg-white/10 mb-2" />
                <div className="animate-pulse h-4 w-24 rounded-lg bg-white/10" />
              </div>
            ) : hasSub ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span
                      className="text-[18px] font-black"
                      style={{
                        fontFamily: "'Cormorant Garamond',Georgia,serif",
                        color: ACCENT,
                      }}
                    >
                      {profile.plan_name}
                    </span>
                    <span
                      className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${ACCENT}18`,
                        color: ACCENT,
                        border: `1px solid ${ACCENT}33`,
                      }}
                    >
                      {formatDuration(profile.duration_days)}
                    </span>
                  </div>
                  <span
                    className="text-[20px] font-black"
                    style={{
                      fontFamily: "'Cormorant Garamond',Georgia,serif",
                      color: ACCENT,
                    }}
                  >
                    ₹{profile.plan_price}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,.3)"
                      strokeWidth={2}
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-[11px] text-white/30">
                      Expires{' '}
                      <span className="text-white/55 font-semibold">
                        {formatExpiry(profile.end_date)}
                      </span>
                    </span>
                  </div>
                  {profile.days_left !== null && (
                    <span
                      className="text-[11px] font-black px-2.5 py-1 rounded-full"
                      style={{
                        background:
                          profile.days_left <= 3
                            ? 'rgba(239,68,68,.15)'
                            : `${ACCENT}15`,
                        color: profile.days_left <= 3 ? '#f87171' : ACCENT,
                        border: `1px solid ${
                          profile.days_left <= 3
                            ? 'rgba(239,68,68,.3)'
                            : ACCENT + '33'
                        }`,
                      }}
                    >
                      {profile.days_left === 0
                        ? 'Expires today'
                        : `${profile.days_left} din baaki`}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-white/35 py-1">
                No active subscription
              </p>
            )}
          </div>
        </div>

        {/* Renew button */}
        <div
          className="mb-4"
          style={{ ...anim('.22s'), opacity: fromCache ? 1 : 0 }}
        >
          {payErr && (
            <p className="text-[11px] text-red-400 text-center mb-2">{payErr}</p>
          )}
          <button
            onClick={handleRenew}
            disabled={paying}
            className="w-full py-3 rounded-[13px] text-[13px] font-black text-white tracking-wide flex items-center justify-center disabled:opacity-60"
            style={{
              background: 'linear-gradient(90deg,#be123c,#FF2D6B,#f43f5e)',
              boxShadow: '0 8px 22px -6px rgba(255,45,107,.5)',
              letterSpacing: '.04em',
            }}
          >
            {paying ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" />
                </svg>
                Processing...
              </span>
            ) : (
              <>✦ {hasSub ? 'Renew Plan' : 'Subscribe Now'}</>
            )}
          </button>
        </div>

        {/* Logout */}
        <div style={{ ...anim('.28s'), opacity: fromCache ? 1 : 0 }}>
          {!showLogout ? (
            <button
              onClick={() => setShowLogout(true)}
              className="w-full py-3 rounded-[13px] text-[13px] font-semibold"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                color: 'rgba(255,255,255,.4)',
              }}
            >
              Log Out
            </button>
          ) : (
            <div
              className="rounded-[13px] px-5 py-4 text-center"
              style={{
                background: 'rgba(220,38,38,.08)',
                border: '1px solid rgba(220,38,38,.25)',
              }}
            >
              <p className="text-[13px] text-white/60 mb-3">Confirm logout?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-2.5 rounded-[10px] text-[12px] font-bold text-white/45"
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.08)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-[10px] text-[12px] font-bold text-white"
                  style={{
                    background: 'rgba(220,38,38,.55)',
                    border: '1px solid rgba(220,38,38,.4)',
                  }}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
