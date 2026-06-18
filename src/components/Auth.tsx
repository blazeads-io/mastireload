'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EPISODES = [
  {
    title: 'Suno Sasur Ji',
    ep: 'Episode 1',
    genre: 'Sci-Fi',
    accent: '#e94560',
    img: '/assets/image/episode1.png',
  },
  {
    title: 'Jor Ka Jhatka',
    ep: 'Episode 2',
    genre: 'Thriller',
    accent: '#f5a623',
    img: '/assets/image/episode2.png',
  },
  {
    title: 'Suno Sasur Ji',
    ep: 'Episode 3',
    genre: 'Drama',
    accent: '#53d8fb',
    img: '/assets/image/episode3.png',
  },
  {
    title: 'Suno Sasur Ji',
    ep: 'Episode 4',
    genre: 'Adventure',
    accent: '#2ecc71',
    img: '/assets/image/episode4.png',
  },
  {
    title: 'Jor Ka Jhatka',
    ep: 'Episode 5',
    genre: 'Mystery',
    accent: '#e74c3c',
    img: '/assets/image/episode5.png',
  },
  {
    title: 'Suno Sasur Ji',
    ep: 'Episode 6',
    genre: 'Romance',
    accent: '#f39c12',
    img: '/assets/image/episode6.png',
  },
  {
    title: 'Jor Ka Jhatka',
    ep: 'Episode 7',
    genre: 'Action',
    accent: '#9b59b6',
    img: '/assets/image/episode7.png',
  },
];

interface EpisodeCardProps {
  title: string;
  ep: string;
  genre: string;
  accent: string;
  img: string;
  index: number;
}

function EpisodeCard({ title, ep, genre, accent, img }: EpisodeCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl cursor-pointer flex-shrink-0 w-[130px] h-[175px] sm:w-[150px] sm:h-[200px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
      <div
        className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase"
        style={{ background: accent, color: '#fff' }}
      >
        {ep}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p
          className="text-[8px] uppercase tracking-[0.2em] mb-1"
          style={{ color: accent }}
        >
          {genre}
        </p>
        <h3 className="text-white text-xs font-bold leading-tight">{title}</h3>
      </div>
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-xl transition-all duration-300" />
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const len = mobile.length;
  const isComplete = len === 10;
  const progress = (len / 10) * 100;

  const getHint = () => {
    if (len === 0)
      return { text: 'Enter your 10-digit mobile number', type: 'idle' };
    if (len < 10)
      return {
        text: `${10 - len} digit${10 - len === 1 ? '' : 's'} remaining`,
        type: 'active',
      };
    return { text: 'Looks good! Tap to proceed', type: 'success' };
  };

  const hint = getHint();

  const handleSubmit = async () => {
    if (!isComplete || submitted) return;
    setSubmitted(true);
    try {
      const getCookie = (name: string) =>
        document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1] ?? '';

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
          campaignSlug:    localStorage.getItem('mr_campaign')           ?? '',
          metaCampaignId:  localStorage.getItem('mr_meta_campaign_id')   ?? '',
          metaCampaignName: localStorage.getItem('mr_meta_campaign_name') ?? '',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message ?? 'Failed. Please try again.');
        setSubmitted(false);
        return;
      }
      if (data.isSubscribed) {
        router.push(`/auth/otp?mobile=${mobile}`);
      } else {
        const campaign = localStorage.getItem('mr_campaign');
        router.push(`/subscription${campaign ? `?c=${encodeURIComponent(campaign)}` : ''}`);
      }
    } catch {
      alert('Network error. Please try again.');
      setSubmitted(false);
    }
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden text-white"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap');

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(233, 69, 96, 0.3); }
          50% { box-shadow: 0 0 40px rgba(233, 69, 96, 0.6); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out both; }
        .shimmer-text {
          background: linear-gradient(90deg, #e94560, #f5a623, #e94560);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .glass-card-inner {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .scroll-track {
          animation: scroll 25s linear infinite;
        }
        .scroll-track:hover { animation-play-state: paused; }
        .card-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* ── LAYER 1: Background image ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/image/bgcheckout4.png"
        alt="Cinema background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/15" />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(233, 69, 96, 0.02) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(245, 166, 35, 0.01) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── LAYER 2: Episode strip ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pb-4"
        style={{ opacity: 0.7 }}
      >
        <div className="overflow-hidden">
          <div
            className="flex gap-3 scroll-track"
            style={{ width: 'max-content', willChange: 'transform' }}
          >
            {[...EPISODES, ...EPISODES, ...EPISODES].map((ep, i) => (
              <EpisodeCard key={i} {...ep} index={i} />
            ))}
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* ── LAYER 3: Main card ── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm animate-fadeInUp card-float space-y-4 rounded-2xl sm:rounded-3xl p-5 sm:p-6"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(220, 20, 20, 0.35)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            boxShadow: '0 8px 40px rgba(220, 20, 20, 0.12)',
          }}
        >
          {/* Hindi Title */}
          <div className="text-center space-y-1">
            <h1
              className="hindi-title text-4xl sm:text-5xl font-black leading-tight"
              style={{
                fontFamily: "'Tiro Devanagari Hindi', serif",
                color: '#ff1a1a',
                letterSpacing: '0.04em',
                textShadow: '3px 3px 8px rgba(0,0,0,0.5)',
              }}
            >
              गरमा गरम !
            </h1>
            <p className="shimmer-text text-base sm:text-lg font-semibold tracking-wide">
              Webseries
            </p>
          </div>

          {/* Brand Logo */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #aa0a0a, #cc1515)',
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5v14l11-7L8 5z" fill="white" />
                </svg>
              </div>
              <div>
                <span
                  className="text-xl font-black tracking-tight text-white"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                >
                  MASTI
                </span>
                &nbsp;
                <span
                  className="text-xl tracking-tight"
                  style={{ color: '#ff2222' }}
                >
                  RELOAD
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div
            className="rounded-2xl border border-[#dc1414]/40 p-5 relative overflow-hidden"
            style={{ background: 'rgba(180, 10, 10, 0.08)' }}
          >
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff2020] to-transparent" />

            {/* Hook line */}
            <p
              className="text-white/90 text-sm text-center font-semibold mb-1 leading-snug"
              style={{
                fontFamily: "'Tiro Devanagari Hindi', serif",
                fontSize: '15px',
              }}
            >
              रुको मत... मज़ा अभी शुरू हुआ है 🌶️
            </p>
            <p
              className="text-center mb-3 text-xs font-medium tracking-wide"
              style={{
                color: '#e45454',
                textShadow:
                  '0 0 8px rgba(228,84,84,0.8), 0 2px 4px rgba(0,0,0,0.6)',
              }}
            >
              Sirf ek number se unlock karo poori duniya ki masti!
            </p>

            {/* Bottom shimmer line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff2020] to-transparent" />
          </div>
          {/* Mobile Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 uppercase tracking-widest block">
              Mobile Number
            </label>

            {/* Input Shell */}
            <div
              className="flex items-stretch rounded-xl overflow-hidden transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: focused
                  ? '1.5px solid #ff2020'
                  : isComplete
                    ? '1.5px solid #1D9E75'
                    : '1.5px solid rgba(255,255,255,0.3)',
                boxShadow: focused
                  ? '0 0 0 3px rgba(255, 30, 30, 0.25)'
                  : isComplete
                    ? '0 0 0 3px rgba(29, 158, 117, 0.2)'
                    : 'none',
              }}
            >
              {/* Country Badge */}
              <div className="flex items-center gap-2 px-3 bg-gray-100 border-r border-gray-200 text-sm font-medium text-gray-700 flex-shrink-0">
                <svg
                  viewBox="0 0 22 22"
                  width="22"
                  height="22"
                  className="rounded-full overflow-hidden flex-shrink-0"
                >
                  <rect x="0" y="0" width="22" height="7.33" fill="#FF9933" />
                  <rect x="0" y="7.33" width="22" height="7.33" fill="#fff" />
                  <rect
                    x="0"
                    y="14.66"
                    width="22"
                    height="7.34"
                    fill="#138808"
                  />
                  <circle
                    cx="11"
                    cy="11"
                    r="2.6"
                    fill="none"
                    stroke="#000088"
                    strokeWidth="0.8"
                  />
                </svg>
                +91
              </div>

              {/* Text Input */}
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="flex-1 bg-transparent px-3 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none min-w-0 tracking-wide"
              />

              {/* Clear Button */}
              {len > 0 && (
                <button
                  onClick={() => setMobile('')}
                  className="w-10 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                  tabIndex={-1}
                  aria-label="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: isComplete ? '#1D9E75' : '#ff2020',
                }}
              />
            </div>

            {/* Hint Text */}
            <p
              className="text-xs flex items-center gap-1.5 transition-colors duration-200"
              style={{
                color:
                  hint.type === 'success'
                    ? '#1D9E75'
                    : hint.type === 'active'
                      ? '#ff6666'
                      : 'rgba(255,255,255,0.45)',
              }}
            >
              {hint.type === 'success' ? '✓' : 'ℹ️'} {hint.text}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitted}
            className={`w-full py-3.5 sm:py-4 rounded-xl font-black text-sm sm:text-base tracking-widest uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50${isComplete && !submitted ? ' btn-red-glow' : ''}`}
            style={{
              background: 'linear-gradient(135deg, #c00000, #e61010, #c00000)',
              backgroundSize: '200% auto',
              boxShadow: isComplete
                ? '0 4px 24px rgba(220, 20, 20, 0.55)'
                : 'none',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {submitted ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="31.4 31.4"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>PROCEED TO</span>
                <span
                  style={{
                    fontFamily: "'Tiro Devanagari Hindi', serif",
                    textTransform: 'none',
                    letterSpacing: '0.03em',
                  }}
                >
                  गरमा गरम 🔥
                </span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
