'use client';

import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

function EpisodeCard({
  title,
  ep,
  genre,
  accent,
  img,
}: Omit<(typeof EPISODES)[0], 'img'> & { img: string }) {
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

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobile = searchParams.get('mobile') ?? '';
  const isMobileValid = /^[6-9]\d{9}$/.test(mobile);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [resendCount, setResendCount] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer, resendCount]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Redirect if mobile is missing/invalid
  useEffect(() => {
    if (!isMobileValid) {
      router.replace('/auth');
    }
  }, [isMobileValid, router]);

  const focusInput = (index: number) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setStatus('idle');
    setErrorMsg('');
    if (digit && index < OTP_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight') {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => {
      next[i] = d;
    });
    setOtp(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const filledCount = otp.filter(Boolean).length;
  const isComplete = filledCount === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isMobileValid || !isComplete || status === 'loading') {
      if (!isMobileValid) {
        setStatus('error');
        setErrorMsg('Invalid mobile number. Please login again.');
      }
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: otp.join('') }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('mr_mobile', data.data.mobile);
        setStatus('success');

        const pendingPlan = localStorage.getItem('mr_pending_plan');
        const campaign    = localStorage.getItem('mr_campaign');
        const dest = data.data.hasActiveSub
          ? (pendingPlan ? `/subscription${campaign ? `?c=${encodeURIComponent(campaign)}` : ''}` : '/')
          : `/subscription${campaign ? `?c=${encodeURIComponent(campaign)}` : ''}`;
        setTimeout(() => { window.location.href = dest; }, 1200);
      } else {
        setStatus('error');
        setErrorMsg(data.message ?? 'Invalid OTP. Please try again.');
        setOtp(Array(OTP_LENGTH).fill(''));
        focusInput(0);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!isMobileValid || timer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setStatus('idle');
    setErrorMsg('');
    setTimer(RESEND_SECONDS);
    setResendCount((c) => c + 1);
    focusInput(0);
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
    } catch {
      // silently ignore resend errors
    }
  };

  const maskedMobile =
    mobile.length >= 10
      ? `+91 ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`
      : `+91 ${mobile}`;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden text-white"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap');

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes scroll {
          0%   { transform: translateX(0);    }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-8px); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0);    }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX( 6px); }
        }
        @keyframes pop {
          0%   { transform: scale(1);    }
          40%  { transform: scale(1.18); }
          100% { transform: scale(1);    }
        }
        @keyframes successPulse {
          0%   { box-shadow: 0 0 0 0   rgba(46,204,113,0.6); }
          70%  { box-shadow: 0 0 0 14px rgba(46,204,113,0);  }
          100% { box-shadow: 0 0 0 0   rgba(46,204,113,0);   }
        }
        @keyframes timerSpin {
          from { stroke-dashoffset: 88; }
          to   { stroke-dashoffset: 0;  }
        }

        .animate-fadeInUp  { animation: fadeInUp 0.8s ease-out both; }
        .shimmer-text {
          background: linear-gradient(90deg, #e94560, #f5a623, #e94560);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .glass-card-inner {
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .scroll-track            { animation: scroll 25s linear infinite; }
        .scroll-track:hover      { animation-play-state: paused; }
        .card-float              { animation: float 6s ease-in-out infinite; }
        .shake                   { animation: shake 0.4s ease-in-out; }
        .otp-success .otp-box    { animation: successPulse 0.6s ease-out; border-color: #2ecc71 !important; }
        .otp-digit-filled        { animation: pop 0.2s ease-out; }

        .otp-box {
          width: 46px; height: 54px;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          font-size: 22px; font-weight: 800;
          text-align: center; color: #fff;
          outline: none;
          caret-color: #e94560;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-security: disc;
        }
        .otp-box:focus {
          border-color: #e94560;
          background: rgba(233,69,96,0.12);
          box-shadow: 0 0 0 3px rgba(233,69,96,0.2);
        }
        .otp-box.filled {
          border-color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.12);
        }
        .otp-box.success-box {
          border-color: #2ecc71 !important;
          background: rgba(46,204,113,0.15) !important;
          box-shadow: 0 0 0 3px rgba(46,204,113,0.2) !important;
        }
        .otp-box.error-box {
          border-color: #e74c3c !important;
          background: rgba(231,76,60,0.12) !important;
        }

        .progress-ring {
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }

        .verify-btn {
          background: linear-gradient(135deg, #e94560, #c0392b);
          box-shadow: 0 4px 20px rgba(233,69,96,0.4);
          transition: all 0.3s;
        }
        .verify-btn:hover:not(:disabled) {
          box-shadow: 0 6px 28px rgba(233,69,96,0.6);
          transform: translateY(-1px);
        }
        .verify-btn:active:not(:disabled) { transform: scale(0.98); }
        .verify-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .verify-btn.success-btn {
          background: linear-gradient(135deg, #27ae60, #1e8449) !important;
          box-shadow: 0 4px 20px rgba(39,174,96,0.5) !important;
        }
      `}</style>

      {/* BG image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/image/bgcheckout4.png"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, rgba(233,69,96,0.04) 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 20%, rgba(245,166,35,0.02) 0%, transparent 50%)`,
        }}
      />

      {/* Episode strip */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pb-4"
        style={{ opacity: 0.65 }}
      >
        <div className="overflow-hidden">
          <div
            className="flex gap-3 scroll-track"
            style={{ width: 'max-content', willChange: 'transform' }}
          >
            {[...EPISODES, ...EPISODES, ...EPISODES].map((ep, i) => (
              <EpisodeCard key={i} {...ep} />
            ))}
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Main card */}
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
          {/* Brand */}
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

          {/* Heading */}
          <div className="text-center space-y-1">
            {/* Animated lock → check icon */}
            <div className="flex justify-center mb-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    status === 'success' ? '#aa0a0a' : 'rgba(233,69,96,0.15)',
                  border: `1.5px solid ${status === 'success' ? 'rgba(46,204,113,0.5)' : 'rgba(233,69,96,0.35)'}`,
                  transition: 'all 0.4s',
                }}
              >
                {status === 'success' ? (
                  <svg
                    className="w-7 h-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#cf0a0a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-7 h-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e02d4b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </div>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-black text-white"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
            >
              Verify OTP
            </h1>
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
              Code dalo aur unlock karo poori masti!
            </p>
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
              We&apos;ve sent a 6-digit code to
            </p>
            <p className="shimmer-text text-sm font-bold tracking-wide">
              {maskedMobile}
            </p>
          </div>

          {/* OTP boxes */}
          <div
            className={`flex justify-center gap-2 sm:gap-3 ${status === 'error' ? 'shake' : ''} ${status === 'success' ? 'otp-success' : ''}`}
            onAnimationEnd={() => status === 'error' && setStatus('idle')}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                className={`otp-box
                  ${digit ? 'filled' : ''}
                  ${status === 'success' ? 'success-box' : ''}
                  ${status === 'error' ? 'error-box' : ''}
                `}
                style={
                  {
                    WebkitTextSecurity: digit ? 'disc' : 'none',
                  } as React.CSSProperties
                }
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                autoComplete="one-time-code"
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          {/* Error message */}
          {errorMsg && (
            <p
              className="text-center text-xs font-medium"
              style={{ color: '#e74c3c' }}
            >
              ⚠ {errorMsg}
            </p>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {otp.map((d, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: d ? '20px' : '6px',
                  height: '6px',
                  background: d
                    ? status === 'success'
                      ? '#2ecc71'
                      : '#e94560'
                    : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={
              !isComplete || status === 'loading' || status === 'success'
            }
            className={`verify-btn w-full py-3.5 rounded-xl font-black text-sm tracking-widest uppercase text-white ${status === 'success' ? 'success-btn' : ''}`}
            style={{
              background: 'linear-gradient(135deg, #c00000, #e61010, #c00000)',
              backgroundSize: '200% auto',
              boxShadow: isComplete
                ? '0 4px 24px rgba(220, 20, 20, 0.55)'
                : 'none',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {status === 'loading' ? (
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
                Verifying...
              </span>
            ) : status === 'success' ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Verified!
              </span>
            ) : (
              'Verify OTP'
            )}
          </button>

          {/* Resend row */}
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => router.back()}
              className="text-white/50 hover:text-white/90 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Change number
            </button>

            <div className="flex items-center gap-2">
              {timer > 0 ? (
                <span className="flex items-center gap-1.5 text-white/50">
                  {/* Mini circular timer */}
                  <svg width="18" height="18" viewBox="0 0 32 32">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="#e94560"
                      strokeWidth="3"
                      strokeDasharray="88"
                      strokeDashoffset={
                        88 - (88 * (RESEND_SECONDS - timer)) / RESEND_SECONDS
                      }
                      strokeLinecap="round"
                      className="progress-ring"
                    />
                  </svg>
                  Resend in {timer}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="font-semibold transition-colors"
                  style={{ color: '#e94560' }}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-white/35 text-[10px]">
            Didn&apos;t receive? Check spam or{' '}
            <span className="text-white/55 cursor-pointer hover:text-white/80 transition-colors">
              contact support
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
