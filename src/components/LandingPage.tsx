'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import HlsPlayer from './HlsPlayer';

/* ── TYPES ───────────────────────────────────────────────────── */
interface MediaItem {
  id: number;
  title: string;
  sub: string;
  tag: string;
  genre: string;
  dur: string;
  rating: string;
  year: string;
  accent: string;
  thumbnail: string;
  videoUrl: string;
}

interface RowData {
  label: string;
  desc: string;
  items: MediaItem[];
}

/* ── DATA ────────────────────────────────────────────────────── */
const SLIDES: MediaItem[] = [
  {
    id: 0,
    thumbnail: '/assets/thumbnails/Trapped.png',
    videoUrl:

  
      'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/Trapped/index.m3u8?autoplay=true&loop=false&muted=true&preload=true&responsive=true',
    tag: 'NO RULES. NO LIMITS.',
    title: 'Raat Baaki Hai',
    sub: 'Jab shehar sota hai, tab asli kahani shuru hoti hai',
    genre: 'Drama',
    dur: '1h 42m',
    rating: '9.2',
    year: '2025',
    accent: '#e11d48',
  },
  {
    id: 1,
    thumbnail:
      '/assets/thumbnails/didithappened.png',
    videoUrl:
      'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/didithappened/index.m3u8?autoplay=true&loop=false&muted=true&preload=true&responsive=true',
    tag: 'TRENDING #1',
    title: 'Ishq 2 AM',
    sub: 'Mohabbat, junoon aur kuch aise raaz jo kabhi nahi khulte',
    genre: 'Drama',
    dur: '2h 08m',
    rating: '8.4',
    year: '2025',
    accent: '#ec4899',
  },
  {
    id: 2,
    thumbnail: '/assets/thumbnails/agentmona.png',
    videoUrl:
      'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/agentmona/index.m3u8?autoplay=true&loop=false&muted=true&preload=true&responsive=true',
    tag: 'PLAY. PAUSE. TEMPTATION.',
    title: 'Raaz-e-Ishq',
    sub: 'Har nazar ke peeche ek khamosh kahani chhupi hai',
    genre: 'Thriller',
    dur: '1h 55m',
    rating: '9.1',
    year: '2025',
    accent: '#f43f5e',
  },
];

const ROWS: RowData[] = [
  {
    label: 'Trending Now',
    desc: 'Sabse zyada dekhi jaane waali content — abhi is waqt',
    items: [
      {
        id: 1,
        tag: 'AFTER MIDNIGHT',
        title: 'Raat Ka Junoon',
        sub: 'Shehar soya nahi… aur raaz jaag rahe hain',
        genre: 'Drama',
        dur: '1h 42m',
        rating: '9.2',
        year: '2025',
        accent: '#e11d48',
        thumbnail:
          '/assets/thumbnails/9oclock.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/9clock/index.m3u8',
      },
      {
        id: 2,
        tag: 'HOT STREAM',
        title: 'Bekhudi',
        sub: 'Junoon jab hadh se guzre toh sab kuch badal jaata hai',
        genre: 'Thriller',
        dur: '2h 08m',
        rating: '8.4',
        year: '2025',
        accent: '#ec4899',
        thumbnail:
          '/assets/thumbnails/agentmona.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/agentmona/index.m3u8',
      },
      {
        id: 3,
        tag: 'EXCLUSIVE DROP',
        title: 'Ishq-e-Siyah',
        sub: 'Mohabbat aur andhera ek saath chal rahe hain',
        genre: 'Drama',
        dur: '1h 55m',
        rating: '9.1',
        year: '2025',
        accent: '#f43f5e',
        thumbnail:
          '/assets/thumbnails/dhund.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/dhund/index.m3u8',
      },
      {
        id: 4,
        tag: 'DARK SECRETS',
        title: 'Parde Ke Peeche',
        sub: 'Har chehra ek sach chhupaye baitha hai',
        genre: 'Mystery',
        dur: '1h 38m',
        rating: '8.7',
        year: '2024',
        accent: '#be123c',
        thumbnail:
          '/assets/thumbnails/didithappened.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/didithappened/index.m3u8',
      },
      {
        id: 5,
        tag: 'VIEWERS OBSESSION',
        title: 'Nasha-e-Dil',
        sub: 'Ehsaas jo hosh uda de',
        genre: 'Romance',
        dur: '2h 14m',
        rating: '8.2',
        year: '2025',
        accent: '#fb7185',
        thumbnail:
          '/assets/thumbnails/dream.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/DREAM/index.m3u8',
      },
      {
        id: 6,
        tag: 'AFTER DARK',
        title: 'Band Kamra',
        sub: 'Jahan se koi awaaz wapas nahi aati',
        genre: 'Horror',
        dur: '1h 50m',
        rating: '8.0',
        year: '2024',
        accent: '#9f1239',
        thumbnail:
          '/assets/thumbnails/eyeditcher.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/eyeditcher/index.m3u8',
      },
      {
        id: 17,
        tag: 'BINGE WORTHY',
        title: 'Junoon-e-Shab',
        sub: 'Ek raat jo zindagi badal deti hai',
        genre: 'Drama',
        dur: '1h 47m',
        rating: '8.6',
        year: '2025',
        accent: '#e11d48',
        thumbnail:
          '/assets/thumbnails/game_plan.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/gameplan/index.m3u8',
      },
      {
        id: 18,
        tag: 'VIEWERS CHOICE',
        title: 'Khamosh Hawa',
        sub: 'Khamoshi bhi kai baar sab kuch keh deti hai',
        genre: 'Romance',
        dur: '2h 01m',
        rating: '8.1',
        year: '2025',
        accent: '#ec4899',
        thumbnail:
          '/assets/thumbnails/gun_point.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/gunpoint/index.m3u8',
      },
      {
        id: 19,
        tag: 'MOST WATCHED',
        title: 'Laal Rishta',
        sub: 'Khoon ke rishte aur pyaar ki dushmaniyaan',
        genre: 'Crime',
        dur: '1h 59m',
        rating: '8.8',
        year: '2024',
        accent: '#f43f5e',
        thumbnail: '/assets/thumbnails/hello_lily.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/helloLilly/index.m3u8',
      },
      {
        id: 20,
        tag: 'VIRAL HIT',
        title: 'Andha Pyaar',
        sub: 'Mohabbat jab aankhein band karke ki jaaye',
        genre: 'Thriller',
        dur: '1h 33m',
        rating: '7.9',
        year: '2025',
        accent: '#be123c',
        thumbnail:
          '/assets/thumbnails/in_laws.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/InLaws/index.m3u8',
      },
    ],
  },
  {
    label: 'Critically Acclaimed',
    desc: 'Award-winning stories jo dil chhu leti hain aur yaad rehti hain',
    items: [
      {
        id: 7,
        tag: 'CRITICS PICK',
        title: 'Mehroom',
        sub: 'Pyaar, dard aur adhuri kahani',
        genre: 'Musical',
        dur: '2h 02m',
        rating: '9.3',
        year: '2025',
        accent: '#ec4899',
        thumbnail:
          '/assets/thumbnails/Intercourse 2.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/intercourse2/index.m3u8',
      },
      {
        id: 8,
        tag: 'TOP RATED',
        title: 'Do Jahaan',
        sub: 'Do dil, ek faisla, aur ek toota hua waqt',
        genre: 'Sci-Fi',
        dur: '1h 49m',
        rating: '8.9',
        year: '2024',
        accent: '#fb7185',
        thumbnail:
          '/assets/thumbnails/Intercourse 3.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/intercourse3/index.m3u8',
      },
      {
        id: 9,
        tag: 'AWARD WINNER',
        title: 'Surkh Raatein',
        sub: 'Har raaz ki keemat hoti hai',
        genre: 'Crime',
        dur: '2h 21m',
        rating: '8.5',
        year: '2025',
        accent: '#e11d48',
        thumbnail:
          '/assets/thumbnails/Kinaya.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/Kinaya/index.m3u8',
      },
      {
        id: 10,
        tag: 'EMOTIONAL DRAMA',
        title: 'Khamoshi',
        sub: 'Jo kaha nahi gaya, wahi sabse zyada chubhta hai',
        genre: 'Drama',
        dur: '1h 58m',
        rating: '8.0',
        year: '2024',
        accent: '#f43f5e',
        thumbnail:
          '/assets/thumbnails/Live In.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/livein/index.m3u8',
      },
      {
        id: 11,
        tag: 'ROMANTIC HIT',
        title: 'Tera Nasha',
        sub: 'Mohabbat ki koi manzil nahi hoti',
        genre: 'Romance',
        dur: '1h 44m',
        rating: '7.6',
        year: '2025',
        accent: '#be123c',
        thumbnail:
          '/assets/thumbnails/Lockdown.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/all_new_21april/lockdown/index.m3u8',
      },
      {
        id: 12,
        tag: 'ACTION SPECIAL',
        title: 'Shehar 2 AM',
        sub: 'Raat jab jaagti hai, shehar badal jaata hai',
        genre: 'Action',
        dur: '2h 05m',
        rating: '8.3',
        year: '2025',
        accent: '#9f1239',
        thumbnail:
          '/assets/thumbnails/love lust.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/all_new_21april/loveandlust/index.m3u8',
      },
      {
        id: 21,
        tag: 'GOLDEN AWARD',
        title: 'Zindagi Ke Raaz',
        sub: 'Woh raaz jo zindagi bhar chhupaaye nahi ja sakte',
        genre: 'Drama',
        dur: '2h 12m',
        rating: '9.0',
        year: '2025',
        accent: '#ec4899',
        thumbnail:
          '/assets/thumbnails/Missing Condom.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/all_new_21april/missingcondom/index.m3u8',
      },
      {
        id: 22,
        tag: 'BEST DRAMA',
        title: 'Khwaab Shehar',
        sub: 'Sapno ka shehar, haqeeqat ki zindaan',
        genre: 'Fantasy',
        dur: '1h 52m',
        rating: '8.7',
        year: '2024',
        accent: '#fb7185',
        thumbnail:
          '/assets/thumbnails/Move On.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/all_new_21april/moveon/index.m3u8',
      },
      {
        id: 23,
        tag: 'MASTERPIECE',
        title: 'Kali Roshni',
        sub: 'Andhere mein bhi roshni dhundh leti hai raah apni',
        genre: 'Thriller',
        dur: '2h 18m',
        rating: '9.2',
        year: '2025',
        accent: '#e11d48',
        thumbnail:
          '/assets/thumbnails/muse.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/all_new_21april/Muse/index.m3u8',
      },
      {
        id: 24,
        tag: 'ACCLAIMED',
        title: 'Teri Justaju',
        sub: 'Talaash mein nikal gaye, khud ko hi kho baithe',
        genre: 'Romance',
        dur: '1h 46m',
        rating: '8.4',
        year: '2025',
        accent: '#f43f5e',
        thumbnail:
          '/assets/thumbnails/Night in LA.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/nightinLA/index.m3u8',
      },
    ],
  },
  {
    label: 'New Arrivals',
    desc: 'Bilkul taaza releases — seedha aapke liye, pehli baar streaming',
    items: [
      {
        id: 13,
        tag: 'NEW ARRIVAL',
        title: 'Dil Ki Baazi',
        sub: 'Har jeet ke peeche ek naya twist',
        genre: 'Action',
        dur: '1h 32m',
        rating: '8.8',
        year: '2025',
        accent: '#fb7185',
        thumbnail:
          '/assets/thumbnails/Night in Mumbai.jpg',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/all_new_21april/nightinmumbai/index.m3u8',
      },
      {
        id: 14,
        tag: 'JUST RELEASED',
        title: 'Ankahe Khat',
        sub: 'Kuch baatein sirf dil samajhta hai',
        genre: 'Period',
        dur: '2h 17m',
        rating: '8.6',
        year: '2025',
        accent: '#e11d48',
        thumbnail:
          '/assets/thumbnails/The Gateway.jpg',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/all_new_21april/thegateway/index.m3u8',
      },
      {
        id: 15,
        tag: 'DARK HORROR',
        title: 'Andhere Phool',
        sub: 'Sach jab saamne aata hai toh andhera gehra ho jaata hai',
        genre: 'Horror',
        dur: '1h 51m',
        rating: '8.3',
        year: '2024',
        accent: '#9f1239',
        thumbnail:
          '/assets/thumbnails/THe Last Trip.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/thelasttrip/index.m3u8',
      },
      {
        id: 16,
        tag: 'FANTASY DRAMA',
        title: 'Gulaabi Raatein',
        sub: 'Sapne aur haqeeqat ke beech ki duniya',
        genre: 'Fantasy',
        dur: '1h 39m',
        rating: '7.9',
        year: '2025',
        accent: '#ec4899',
        thumbnail:
          '/assets/thumbnails/THe Pink Club.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/thepinkclub/index.m3u8',
      },
      {
        id: 25,
        tag: 'FRESH RELEASE',
        title: 'Raaton Ka Saya',
        sub: 'Raat ka saya aur dil ka darr, dono saath chalta hai',
        genre: 'Horror',
        dur: '1h 44m',
        rating: '8.1',
        year: '2025',
        accent: '#be123c',
        thumbnail:
          '/assets/thumbnails/The Yoga Expeience.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/theyogaexperience/index.m3u8',
      },
      {
        id: 26,
        tag: 'HOT NEW',
        title: 'Siyaah Mohabbat',
        sub: 'Woh mohabbat jo roshni mein nahi, andheron mein palti hai',
        genre: 'Drama',
        dur: '2h 03m',
        rating: '8.5',
        year: '2025',
        accent: '#f43f5e',
        thumbnail:
          '/assets/thumbnails/Traffic Signal.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/trafficsignal/index.m3u8',
      },
      {
        id: 27,
        tag: 'JUST DROPPED',
        title: 'Buri Nazar',
        sub: 'Nazar lagne se pehle hi sab kuch bikhar jaata hai',
        genre: 'Mystery',
        dur: '1h 36m',
        rating: '7.8',
        year: '2025',
        accent: '#ec4899',
        thumbnail:
          '/assets/thumbnails/Trapped.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/Trapped/index.m3u8',
      },
      {
        id: 28,
        tag: 'BRAND NEW',
        title: 'Do Lamhe',
        sub: 'Sirf do pal ki mohabbat, lekin yaadein poori zindagi ki',
        genre: 'Romance',
        dur: '1h 28m',
        rating: '8.0',
        year: '2025',
        accent: '#fb7185',
        thumbnail:
          '/assets/thumbnails/Typewritter.png',
        videoUrl:
          'https://dxc62cy2vpupe.cloudfront.net/All_New_17April/TYPEWRITER/index.m3u8',
      },
      // {
      //   id: 29,
      //   tag: 'LATEST DROP',
      //   title: 'Raat Ki Rani',
      //   sub: 'Raat ke andheron mein jo chalti hai, woh apni marzil jaanti hai',
      //   genre: 'Action',
      //   dur: '1h 53m',
      //   rating: '8.6',
      //   year: '2025',
      //   accent: '#e11d48',
      //   thumbnail:
      //     'https://vz-624830fb-ea4.b-cdn.net/5e079aa4-dd4f-4d37-af0b-999b3157f47e/thumbnail.jpg',
      //   videoUrl:
      //     'https://player.mediadelivery.net/embed/672821/5e079aa4-dd4f-4d37-af0b-999b3157f47e?autoplay=true&loop=false&muted=true&preload=true&responsive=true',
      // },
      // {
      //   id: 30,
      //   tag: 'NEW THIS WEEK',
      //   title: 'Pagal Ishq',
      //   sub: 'Pyaar mein paagal hona padta hai — yahi sachchi mohabbat hai',
      //   genre: 'Romance',
      //   dur: '2h 07m',
      //   rating: '8.2',
      //   year: '2025',
      //   accent: '#9f1239',
      //   thumbnail:
      //     'https://vz-624830fb-ea4.b-cdn.net/70f49e1a-36b7-4278-997f-e3baafa823a4/thumbnail_26056e6a.jpg',
      //   videoUrl:
      //     'https://player.mediadelivery.net/embed/672821/70f49e1a-36b7-4278-997f-e3baafa823a4?autoplay=true&loop=false&muted=true&preload=true&responsive=true',
      // },
    ],
  },
];

/* ── ICONS ───────────────────────────────────────────────────── */
const IconPlay = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6,3 20,12 6,21" />
  </svg>
);
const IconChevL = () => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <polyline points="15,18 9,12 15,6" />
  </svg>
);
const IconChevR = () => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <polyline points="9,18 15,12 9,6" />
  </svg>
);
const IconInfo = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/* ── PLAYER PAGE ─────────────────────────────────────────────── */
function PlayerPage({ item, onBack }: { item: MediaItem; onBack: () => void }) {
  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      <div
        className="flex items-center gap-4 px-6 py-4 z-10"
        style={{
          background: 'linear-gradient(to bottom,rgba(0,0,0,.98),transparent)',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-semibold tracking-widest uppercase cursor-pointer border-0 bg-transparent"
        >
          ← Back
        </button>
        <div className="h-4 w-px bg-white/20" />
        <span
          className="text-white font-black tracking-tight text-lg"
          style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}
        >
          {item.title}
        </span>
        <span
          className="ml-2 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded"
          style={{
            background: `${item.accent}25`,
            color: item.accent,
            border: `1px solid ${item.accent}44`,
          }}
        >
          {item.genre}
        </span>
      </div>


<div className="flex-1 relative bg-black">
  <HlsPlayer url={item.videoUrl} />
</div>
      <div
        className="px-8 py-5 flex items-center gap-6"
        style={{
          background: 'rgba(0,0,0,.95)',
          borderTop: `1px solid ${item.accent}22`,
        }}
      >
        <div>
          <p className="m-0 text-[11px] text-white/30 tracking-[3px] uppercase mb-1">
            {item.tag}
          </p>
          <p className="m-0 text-white/50 text-sm max-w-2xl">{item.sub}</p>
          <p className="m-0 text-white/25 text-xs mt-1">
            {item.year} · {item.dur}
          </p>
        </div>
        <div
          className="ml-auto text-3xl font-black"
          style={{
            color: item.accent,
            fontFamily: "'Cormorant Garamond',Georgia,serif",
          }}
        >
          ★ {item.rating}
        </div>
      </div>
    </div>
  );
}

/* ── CARD ─────────────────────────────────────────────────────── */
function Card({
  item,
  idx,
  onPlay,
}: {
  item: MediaItem;
  idx: number;
  onPlay: (item: MediaItem) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onPlay(item)}
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{
        width: '220px',
        transform: hov
          ? 'translateY(-12px) scale(1.04)'
          : 'translateY(0) scale(1)',
        transition:
          'transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s ease',
        boxShadow: hov
          ? `0 32px 64px rgba(0,0,0,.9), 0 0 0 1px ${item.accent}66, 0 48px 24px -16px rgba(0,0,0,.95)`
          : '0 8px 24px rgba(0,0,0,.6)',
        borderRadius: '14px',
        overflow: 'hidden',
        animationDelay: `${idx * 55}ms`,
        animation: 'fadeUp .55s ease forwards',
        opacity: 0,
      }}
    >
      {/* ── POSTER IMAGE (no blur) ── */}
      <div className="relative" style={{ height: 310 }}>
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          sizes="220px"
          style={{
            objectFit: 'cover',
            objectPosition: 'top center',
            transition: 'transform .6s ease',
            transform: hov ? 'scale(1.08)' : 'scale(1)',
          }}
        />

        {/* subtle vignette only at bottom — crisp image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,.96) 0%, rgba(0,0,0,.7) 28%, rgba(0,0,0,.15) 60%, transparent 100%)',
          }}
        />

        {/* TAG top-left */}
        <span
          className="absolute top-3 left-3 text-[9px] font-black tracking-[2px] px-2.5 py-1 z-10"
          style={{
            background: item.accent,
            color: '#fff',
            borderRadius: '4px',
            letterSpacing: '0.12em',
          }}
        >
          {item.tag}
        </span>

        {/* RATING top-right */}
        <span
          className="absolute top-3 right-3 text-[11px] font-black px-2 py-1 z-10"
          style={{
            background: 'rgba(0,0,0,.75)',
            color: item.accent,
            borderRadius: '6px',
            border: `1px solid ${item.accent}44`,
          }}
        >
          ★ {item.rating}
        </span>

        {/* PLAY button — only visible on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ opacity: hov ? 1 : 0, transition: 'opacity .3s ease' }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 58,
              height: 58,
              background: '#fff',
              color: item.accent,
              transform: hov ? 'scale(1)' : 'scale(0.7)',
              transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
              boxShadow: `0 0 0 6px ${item.accent}33, 0 16px 40px rgba(0,0,0,.8)`,
            }}
          >
            <IconPlay s={22} />
          </div>
        </div>

        {/* YEAR + DUR bottom row */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          <span className="text-[10px] text-white/40 font-medium">
            {item.dur}
          </span>
          <span className="text-[10px] text-white/20">·</span>
          <span className="text-[10px] text-white/40 font-medium">
            {item.year}
          </span>
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <div
        className="px-4 pt-3.5 pb-4"
        style={{
          background: '#0a0a0a',
          borderTop: `2px solid ${item.accent}55`,
        }}
      >
        {/* TITLE */}
        <p
          className="m-0 text-[15px] font-black text-white leading-tight truncate mb-1"
          style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            letterSpacing: '-0.3px',
          }}
        >
          {item.title}
        </p>
        {/* SUB */}
        <p
          className="m-0 text-[11px] text-white/40 leading-snug mb-2.5"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.sub}
        </p>
        {/* GENRE badge */}
        <span
          className="text-[9px] font-black tracking-[2px] px-2.5 py-1 rounded"
          style={{
            background: `${item.accent}15`,
            color: item.accent,
            border: `1px solid ${item.accent}35`,
            letterSpacing: '0.15em',
          }}
        >
          {item.genre}
        </span>
      </div>
    </div>
  );
}

/* ── ROW ──────────────────────────────────────────────────────── */
function Row({
  row,
  ri,
  onPlay,
}: {
  row: RowData;
  ri: number;
  onPlay: (item: MediaItem) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);

  const check = useCallback(() => {
    if (!ref.current) return;
    const { scrollLeft: sl, scrollWidth: sw, clientWidth: cw } = ref.current;
    setCanL(sl > 4);
    setCanR(sl + cw < sw - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    el?.addEventListener('scroll', check);
    check();
    return () => el?.removeEventListener('scroll', check);
  }, [check]);

  const scroll = (d: 'l' | 'r') =>
    ref.current?.scrollBy({ left: d === 'r' ? 720 : -720, behavior: 'smooth' });

  return (
    <div className="mb-14">
      <div className="px-6 md:px-12 mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-1 h-6 rounded-full"
            style={{ background: ['#e11d48', '#ec4899', '#f43f5e'][ri % 3] }}
          />
          <h2
            className="m-0 text-xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}
          >
            {row.label}
          </h2>
        </div>
        <p className="m-0 text-[12px] text-white/35 tracking-wide pl-4">
          {row.desc}
        </p>
      </div>

      <div className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right,#000,transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left,#000,transparent)' }}
        />

        {canL && (
          <button
            onClick={() => scroll('l')}
            className="absolute left-3 top-[45%] -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer text-white hover:scale-110 transition-transform"
            style={{
              background: 'rgba(255,255,255,.09)',
              border: '1px solid rgba(255,255,255,.14)',
              boxShadow: '0 4px 20px rgba(0,0,0,.7)',
            }}
          >
            <IconChevL />
          </button>
        )}
        {canR && (
          <button
            onClick={() => scroll('r')}
            className="absolute right-3 top-[45%] -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer text-white hover:scale-110 transition-transform"
            style={{
              background: 'rgba(255,255,255,.09)',
              border: '1px solid rgba(255,255,255,.14)',
              boxShadow: '0 4px 20px rgba(0,0,0,.7)',
            }}
          >
            <IconChevR />
          </button>
        )}

        <div
          ref={ref}
          className="flex gap-6 px-6 md:px-12 pb-6 pt-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {row.items.map((item, i) => (
            <Card key={item.id} item={item} idx={i + ri * 10} onPlay={onPlay} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ────────────────────────────────────────────────── */
export default function LandingPage() {
  const [slide, setSlide] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [nowPlaying, setNowPlaying] = useState<MediaItem | null>(null);
  const [heroHov, setHeroHov] = useState(false);

  const goTo = (idx: number) => {
    setSlide(idx);
    setSlideKey((k) => k + 1);
  };

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('mr_purchase') === '1') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSlide((s) => {
        const n = (s + 1) % SLIDES.length;
        setSlideKey((k) => k + 1);
        return n;
      });
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const cur = SLIDES[slide];

  if (nowPlaying)
    return <PlayerPage item={nowPlaying} onBack={() => setNowPlaying(null)} />;

  return (
    <div
      className="min-h-screen bg-black overflow-x-hidden select-none"
      style={{ fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerText {
          0%, 100% { background-position: 200% center; }
          50%       { background-position: 0% center; }
        }
        @keyframes shimmerBtn {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes thumbIn {
          from { opacity: 0; transform: translateY(16px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }

        .shimmer-title {
          background: linear-gradient(90deg, #fff 0%, #e11d48 28%, #ec4899 50%, #e11d48 72%, #fff 100%);
          background-size: 220% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerText 3.8s linear infinite;
        }
        .hero-watch-btn {
          background: linear-gradient(90deg,#e11d48 0%,#ec4899 40%,#f43f5e 60%,#ec4899 80%,#e11d48 100%);
          background-size: 200% auto;
          animation: shimmerBtn 2.2s linear infinite;
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .hero-watch-btn:hover { transform: scale(1.05); }
        .nav-link { transition: color .2s; cursor: pointer; }
        .nav-link:hover { color: #ec4899 !important; }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background:
            'linear-gradient(to bottom,rgba(0,0,0,.95) 0%,rgba(0,0,0,.2) 80%,transparent 100%)',
        }}
      >
        <div className="flex items-center gap-10">
          <span
            className="text-2xl font-black tracking-tighter cursor-pointer"
            style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              background:
                'linear-gradient(90deg,#fff 0%,#ec4899 50%,#e11d48 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            MASTI RElOAD
          </span>
        </div>
        <Link
          href="/profile"
          className="flex items-center px-4 py-2 rounded-full cursor-pointer transition-all whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg,#e11d48,#ec4899)',
            boxShadow: '0 0 16px rgba(236,72,153,.45)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.04em',
          }}
        >
          My Profile
        </Link>
      </nav>

      {/* ══ HERO — FULL WIDTH, NO BLUR ═══════════════════════════ */}
      <section className="relative w-full overflow-hidden h-[68vh] md:h-screen">
        {/* Ambient color glow behind image */}
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 pointer-events-none transition-opacity duration-[1800ms]"
            style={{
              opacity: i === slide ? 1 : 0,
              background: `radial-gradient(ellipse 80% 55% at 20% 65%, ${s.accent}50 0%, transparent 55%)`,
              animation: 'glowPulse 4s ease-in-out infinite',
            }}
          />
        ))}

        {/* SLIDE IMAGES — full width, no blur, no filter */}
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-[1400ms]"
            style={{ opacity: i === slide ? 1 : 0 }}
          >
            <Image
              src={s.thumbnail}
              alt={s.title}
              fill
              priority={i === 0}
              sizes="100vw"
              style={{
                objectFit: 'cover',
                objectPosition: 'top center',
                transform: heroHov && i === slide ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform .7s ease',
              }}
            />
          </div>
        ))}

        {/* Cinematic overlay — only gradient, image stays crisp */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,.65) 0%, rgba(0,0,0,.35) 45%, rgba(0,0,0,.1) 70%, transparent 100%), linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.45) 25%, transparent 55%)',
          }}
        />

        {/* Click area */}
        <div
          className="absolute inset-0 z-[3]"
          onMouseEnter={() => setHeroHov(true)}
          onMouseLeave={() => setHeroHov(false)}
          onClick={() => setNowPlaying(cur)}
          style={{ cursor: 'pointer' }}
        />

        {/* ── HERO CONTENT ── */}
        <div
          key={slideKey}
          className="absolute bottom-0 left-0 z-[4] px-6 md:px-16 pb-14 md:pb-28 max-w-3xl"
          style={{
            animation: 'slideInUp .65s cubic-bezier(.22,1,.36,1) forwards',
          }}
        >
          {/* TAG */}
          <span
            className="inline-block text-[10px] font-black tracking-[4px] px-3 py-1.5 rounded-sm mb-4"
            style={{
              background: cur.accent,
              color: '#fff',
              letterSpacing: '0.18em',
            }}
          >
            {cur.tag}
          </span>

          {/* TITLE */}
          <h1
            className="shimmer-title m-0 font-black leading-none mb-3"
            style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontSize: 'clamp(40px,6vw,80px)',
              letterSpacing: '-2px',
            }}
          >
            {cur.title}
          </h1>

          {/* SUB */}
          <p
            className="m-0 text-base text-white/55 tracking-wide mb-2"
            style={{ maxWidth: '520px' }}
          >
            {cur.sub}
          </p>

          {/* META ROW */}
          <div className="flex items-center gap-4 mb-7">
            <span className="text-[11px] font-black text-white/35 tracking-widest">
              {cur.year}
            </span>
            <span className="text-white/15">·</span>
            <span className="text-[11px] font-black text-white/35 tracking-widest">
              {cur.dur}
            </span>
            <span className="text-[11px] font-black text-white/35 tracking-widest">
              {cur.genre}
            </span>
            <span
              className="text-[12px] font-black"
              style={{ color: cur.accent }}
            >
              ★ {cur.rating}
            </span>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNowPlaying(cur);
              }}
              className="hero-watch-btn flex items-center gap-2.5 px-7 py-3.5 rounded-full text-[13px] font-black text-white border-0 cursor-pointer"
              style={{
                boxShadow: `0 0 32px ${cur.accent}55, 0 12px 28px rgba(0,0,0,.55)`,
                letterSpacing: '0.06em',
              }}
            >
              <IconPlay s={14} /> Watch Now
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-6 py-3.5 rounded-full text-[13px] font-semibold text-white/70 hover:text-white border-0 cursor-pointer transition-colors"
              style={{
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.15)',
                letterSpacing: '0.04em',
              }}
            >
              <IconInfo /> More Info
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="absolute bottom-0 inset-x-0 h-0.5 z-[5]"
          style={{ background: 'rgba(255,255,255,.06)' }}
        >
          <div
            key={`prog-${slideKey}`}
            className="h-full"
            style={{
              background: `linear-gradient(to right,${cur.accent},#ec4899)`,
              animation: 'progressBar 7s linear forwards',
            }}
          />
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[5] flex gap-2.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="border-0 cursor-pointer p-0 rounded-full transition-all duration-500"
              style={{
                width: i === slide ? 28 : 7,
                height: 7,
                background:
                  i === slide
                    ? `linear-gradient(90deg,${cur.accent},#ec4899)`
                    : 'rgba(255,255,255,.2)',
                boxShadow: i === slide ? `0 0 10px ${cur.accent}` : '',
              }}
            />
          ))}
        </div>

        {/* Side arrows */}
        {(['l', 'r'] as const).map((d) => (
          <button
            key={d}
            onClick={() =>
              goTo(
                (slide + (d === 'r' ? 1 : -1) + SLIDES.length) % SLIDES.length,
              )
            }
            className={`absolute ${d === 'l' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 z-[5] w-11 h-11 rounded-full flex items-center justify-center border-0 cursor-pointer text-white hover:scale-110 transition-transform`}
            style={{
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.12)',
              boxShadow: '0 4px 24px rgba(0,0,0,.65)',
            }}
          >
            {d === 'l' ? <IconChevL /> : <IconChevR />}
          </button>
        ))}
      </section>

      {/* ══ DIVIDER ══════════════════════════════════════════════ */}
      <div className="flex items-center gap-5 px-6 md:px-12 pt-16 pb-10">
        <div
          className="h-px flex-1"
          style={{
            background:
              'linear-gradient(to right,transparent,rgba(225,29,72,.4),transparent)',
          }}
        />
        <span className="text-[10px] font-black tracking-[5px] text-rose-600/70">
          BROWSE COLLECTION
        </span>
        <div
          className="h-px flex-1"
          style={{
            background:
              'linear-gradient(to right,transparent,rgba(225,29,72,.4),transparent)',
          }}
        />
      </div>

      {/* ══ CONTENT ROWS ═════════════════════════════════════════ */}
      <section className="bg-black pb-24">
        {ROWS.map((row, ri) => (
          <Row key={row.label} row={row} ri={ri} onPlay={setNowPlaying} />
        ))}
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer
        className="px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-5"
        style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}
      >
        <span
          className="text-2xl font-black tracking-tighter"
          style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            background: 'linear-gradient(90deg,#fff,#ec4899,#e11d48)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          MASTI RElOAD
        </span>
        <p
          className="m-0 text-[11px] tracking-widest"
          style={{ color: 'rgba(255,255,255,.15)' }}
        >
          © 2025 LUMIÈRE · PREMIUM CINEMA EXPERIENCE
        </p>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Help', 'Careers'].map((t) => (
            <span
              key={t}
              className="text-[11px] cursor-pointer tracking-wider hover:text-pink-400 transition-colors"
              style={{ color: 'rgba(255,255,255,.22)' }}
            >
              {t}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
