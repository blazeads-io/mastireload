'use client';

import { useState, useEffect, useCallback } from 'react';

const BLUE    = '#2563EB';
const BLUE_LT = '#EFF6FF';
const BLUE_MD = '#DBEAFE';

const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

type MainTab    = 'payments' | 'marketing';
type StatusFilter = 'all' | 'success' | 'pending' | 'failed';
type MktTab     = 'overview' | 'meta';

const STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  success: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Success' },
  pending: { bg: '#FEFCE8', color: '#A16207', border: '#FEF08A', label: 'Pending' },
  failed:  { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', label: 'Failed'  },
};

interface Profile  { id: number; name: string; email: string | null }
interface PayRow   { id: number; user_mobile: string; amount: number; status: string; campaign_slug: string | null; pixel_id: string | null; ad_account_id: string | null; meta_campaign_id: string | null; meta_campaign_name: string | null; created_at: string }
interface PayStats { total: string; successful: string; pending: string; failed: string; revenue: string }
interface MktOverview { total_purchases: string; capi_sent: string; capi_issues: string }
interface PixelStat   { id: number; slug: string; label: string; pixel_id: string; ad_account_id: string | null; purchases: string; capi_sent: string; capi_issues: string }
interface MetaStat    { meta_campaign_id: string; meta_campaign_name: string | null; campaign_slug: string | null; pixel_label: string | null; pixel_id: string | null; ad_account_id: string | null; purchases: string; capi_sent: string; capi_issues: string }
interface Pixel       { id: number; slug: string; label: string; pixel_id: string; ad_account_id: string | null; is_default: boolean }

const EMPTY_PX = { slug: '', label: '', pixel_id: '', access_token: '', ad_account_id: '' };

const PAGE_SIZE = 100;

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.failed;
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

export default function MBDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<MainTab>('payments');

  /* ── Payments state ── */
  const [payRows, setPayRows]         = useState<PayRow[]>([]);
  const [payStats, setPayStats]       = useState<PayStats | null>(null);
  const [payTotal, setPayTotal]       = useState(0);
  const [payPage, setPayPage]         = useState(1);
  const [payLoading, setPayLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('success');
  const [payFrom, setPayFrom]         = useState(todayStr);
  const [payTo, setPayTo]             = useState(todayStr);
  const [payAllTime, setPayAllTime]   = useState(false);
  const [paySlug, setPaySlug]         = useState('');

  /* ── Marketing state ── */
  const [mktTab, setMktTab]           = useState<MktTab>('overview');
  const [brkTab, setBrkTab]           = useState<'campaign' | 'meta'>('campaign');
  const [mktFrom, setMktFrom]         = useState(todayStr);
  const [mktTo, setMktTo]             = useState(todayStr);
  const [mktAllTime, setMktAllTime]   = useState(false);
  const [mktSlug, setMktSlug]         = useState('');
  const [mktOverview, setMktOverview] = useState<MktOverview | null>(null);
  const [byPixel, setByPixel]         = useState<PixelStat[]>([]);
  const [byMeta, setByMeta]           = useState<MetaStat[]>([]);
  const [pixels, setPixels]           = useState<Pixel[]>([]);
  const [mktLoading, setMktLoading]   = useState(true);
  const [copied, setCopied]           = useState<string | null>(null);
  const [showPxForm, setShowPxForm]   = useState(false);
  const [editPx, setEditPx]           = useState<Pixel | null>(null);
  const [pxForm, setPxForm]           = useState(EMPTY_PX);
  const [showToken, setShowToken]     = useState(false);
  const [pxSaving, setPxSaving]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [pxSearch, setPxSearch]         = useState('');
  const [pxPage, setPxPage]             = useState(1);
  const [pxTotalPages, setPxTotalPages] = useState(1);
  const [pxTotal, setPxTotal]           = useState(0);
  const [pxLoading, setPxLoading]       = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  /* ── Auth check ── */
  useEffect(() => {
    fetch('/api/mediabuyer/me')
      .then((r) => { if (r.status === 401) { window.location.href = '/mediabuyer/login'; return null; } return r.json(); })
      .then((d) => {
        if (!d) return;
        if (!d.success) { window.location.href = '/mediabuyer/login'; return; }
        setProfile(d.profile);
        setAuthLoading(false);
      })
      .catch(() => { window.location.href = '/mediabuyer/login'; });
  }, []);

  /* ── Fetch payments ── */
  const fetchPayments = useCallback(async (pg: number, status: StatusFilter, from: string, to: string, allTime: boolean, slug: string) => {
    setPayLoading(true);
    const params = new URLSearchParams({ page: String(pg), status, ...(slug && { slug_search: slug }), ...(!allTime && from && { from }), ...(!allTime && to && { to }) });
    const r = await fetch(`/api/mediabuyer/payments?${params}`);
    if (r.status === 401) { window.location.href = '/mediabuyer/login'; return; }
    const d = await r.json();
    if (d.success) { setPayRows(d.data); setPayStats(d.stats); setPayTotal(d.total); }
    setPayLoading(false);
  }, []);

  /* ── Fetch marketing ── */
  const fetchMarketing = useCallback(async (from: string, to: string, allTime: boolean, slug: string) => {
    setMktLoading(true);
    const params = new URLSearchParams({ ...(!allTime && from && { from }), ...(!allTime && to && { to }), ...(slug && { slug_search: slug }) });
    const r = await fetch(`/api/mediabuyer/marketing?${params}`);
    if (r.status === 401) { window.location.href = '/mediabuyer/login'; return; }
    const d = await r.json();
    if (d.success) { setMktOverview(d.overview); setByPixel(d.by_pixel); setByMeta(d.by_meta_campaign ?? []); }
    setMktLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && tab === 'payments') fetchPayments(payPage, statusFilter, payFrom, payTo, payAllTime, paySlug);
  }, [authLoading, tab, payPage, statusFilter, payFrom, payTo, payAllTime, paySlug, fetchPayments]);

  const fetchPixelList = useCallback(async (search: string, page: number) => {
    setPxLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    const r = await fetch(`/api/mediabuyer/pixels?${params}`);
    if (r.status === 401) { window.location.href = '/mediabuyer/login'; return; }
    const d = await r.json();
    if (d.success) { setPixels(d.data); setPxTotal(d.total); setPxTotalPages(d.totalPages); }
    setPxLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && tab === 'marketing') fetchMarketing(mktFrom, mktTo, mktAllTime, mktSlug);
  }, [authLoading, tab, mktFrom, mktTo, mktAllTime, mktSlug, fetchMarketing]);

  useEffect(() => {
    if (!authLoading && tab === 'marketing' && mktTab === 'meta') fetchPixelList(pxSearch, pxPage);
  }, [authLoading, tab, mktTab, pxSearch, pxPage, fetchPixelList]);

  async function handleSavePx() {
    setPxSaving(true);
    const url    = editPx ? `/api/mediabuyer/pixels/${editPx.id}` : '/api/mediabuyer/pixels';
    const method = editPx ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...pxForm, ad_account_id: pxForm.ad_account_id || null }) });
    const json   = await res.json();
    setPxSaving(false);
    if (json.success) {
      setShowPxForm(false); setEditPx(null); setPxForm(EMPTY_PX);
      fetchMarketing(mktFrom, mktTo, mktAllTime, mktSlug);
      fetchPixelList(pxSearch, 1); setPxPage(1);
    } else { alert(json.message ?? 'Error saving campaign'); }
  }

  async function handleDeletePx(id: number) {
    const res  = await fetch(`/api/mediabuyer/pixels/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setDeleteConfirm(null);
      fetchMarketing(mktFrom, mktTo, mktAllTime, mktSlug);
      fetchPixelList(pxSearch, 1); setPxPage(1);
    } else { alert(json.message ?? 'Delete failed'); }
  }

  const metaUrl = (slug: string) =>
    `${baseUrl}/?c=${slug}&meta_campaign_id={{campaign.id}}&meta_campaign_name={{campaign.name}}`;

  function copyLink(slug: string) {
    navigator.clipboard.writeText(metaUrl(slug)).then(() => {
      setCopied(slug); setTimeout(() => setCopied(null), 2000);
    });
  }

  const payTotalPages = Math.ceil(payTotal / PAGE_SIZE);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F1F5F9' }}>
        <div className="text-[13px] text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#F1F5F9' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between" style={{ background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${BLUE},#60A5FA)` }}>
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-800 leading-tight">{profile?.name}</p>
            <p className="text-[10px] text-slate-400">{profile?.email ?? 'Media Buyer'}</p>
          </div>
        </div>
        <button onClick={async () => { await fetch('/api/mediabuyer/logout', { method: 'POST' }); window.location.href = '/mediabuyer/login'; }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
          style={{ border: '1px solid #E2E8F0' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Main tabs */}
        <div className="flex items-center gap-1 mb-6">
          {(['payments', 'marketing'] as MainTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-[8px] text-[11px] font-bold tracking-wide transition-all capitalize"
              style={{
                background: tab === t ? BLUE_MD : '#F1F5F9',
                border: `1.5px solid ${tab === t ? BLUE : '#E2E8F0'}`,
                color: tab === t ? BLUE : '#64748B',
              }}>
              {t === 'payments' ? 'Payments' : 'Marketing'}
            </button>
          ))}
        </div>

        {/* ══ PAYMENTS TAB ══ */}
        {tab === 'payments' && (
          <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total',      value: payStats?.total      ?? '0', color: '#475569', bg: '#F8FAFC' },
                { label: 'Successful', value: payStats?.successful  ?? '0', color: '#15803D', bg: '#F0FDF4' },
                { label: 'Pending',    value: payStats?.pending     ?? '0', color: '#A16207', bg: '#FEFCE8' },
                { label: 'Failed',     value: payStats?.failed      ?? '0', color: '#B91C1C', bg: '#FEF2F2' },
              ].map((c) => (
                <div key={c.label} className="rounded-[14px] px-5 py-4" style={{ background: c.bg, border: `1px solid ${c.color}22` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: c.color + 'AA' }}>{c.label}</p>
                  <p className="text-[24px] font-black" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Filters + Table */}
            <div className="rounded-[14px] overflow-hidden" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
              <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                {/* Status filter */}
                {(['all', 'success', 'pending', 'failed'] as StatusFilter[]).map((s) => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPayPage(1); }}
                    className="px-3 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wide transition-all"
                    style={{
                      background: statusFilter === s ? (s === 'success' ? '#F0FDF4' : s === 'pending' ? '#FEFCE8' : s === 'failed' ? '#FEF2F2' : BLUE_MD) : '#F1F5F9',
                      border: `1.5px solid ${statusFilter === s ? (s === 'success' ? '#BBF7D0' : s === 'pending' ? '#FEF08A' : s === 'failed' ? '#FECACA' : BLUE) : '#E2E8F0'}`,
                      color: statusFilter === s ? (s === 'success' ? '#15803D' : s === 'pending' ? '#A16207' : s === 'failed' ? '#B91C1C' : BLUE) : '#64748B',
                    }}>
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}

                <div className="w-px h-4 bg-slate-200 mx-1" />

                {/* All time toggle */}
                <button onClick={() => { setPayAllTime((p) => !p); setPayPage(1); }}
                  className="px-3 py-1 rounded-[6px] text-[10px] font-bold transition-all"
                  style={{ background: payAllTime ? '#EDE9FE' : '#F1F5F9', border: `1.5px solid ${payAllTime ? '#8B5CF6' : '#E2E8F0'}`, color: payAllTime ? '#6D28D9' : '#64748B' }}>
                  All time
                </button>

                {/* Date range */}
                {(['from', 'to'] as const).map((side) => (
                  <div key={side} className="relative flex items-center" style={{ opacity: payAllTime ? 0.4 : 1 }}>
                    <svg className="absolute left-2 pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <input type="date" disabled={payAllTime}
                      value={side === 'from' ? payFrom : payTo}
                      max={side === 'from' ? payTo : undefined}
                      min={side === 'to' ? payFrom : undefined}
                      onChange={(e) => { side === 'from' ? setPayFrom(e.target.value) : setPayTo(e.target.value); setPayPage(1); }}
                      className="pl-7 pr-2 py-1 rounded-[6px] text-[10px] font-semibold text-slate-600 outline-none"
                      style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', cursor: payAllTime ? 'not-allowed' : 'pointer' }} />
                    {side === 'from' && <span className="mx-1 text-[10px] text-slate-400">to</span>}
                  </div>
                ))}

                {/* Slug search */}
                <div className="relative">
                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input value={paySlug} onChange={(e) => { setPaySlug(e.target.value); setPayPage(1); }}
                    placeholder="Search slug..." autoComplete="off"
                    className="pl-6 pr-2 py-1 rounded-[6px] text-[10px] font-semibold outline-none"
                    style={{ background: paySlug ? BLUE_LT : '#F8FAFC', border: `1.5px solid ${paySlug ? BLUE : '#E2E8F0'}`, color: '#334155', width: 120 }} />
                </div>

                <span className="ml-auto text-[11px] text-slate-400">{payTotal} results</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                      {['SN', 'Mobile', 'Amount', 'Status', 'Campaign', 'Meta Cmp Name / ID', 'Date & Time'].map((h) => (
                        <th key={h} className="px-5 py-3 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          {[30, 110, 60, 70, 160, 140, 130].map((w, j) => (
                            <td key={j} className="px-5 py-3.5"><div className="h-4 rounded animate-pulse bg-slate-100" style={{ width: w }} /></td>
                          ))}
                        </tr>
                      ))
                    ) : payRows.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px] text-slate-400">No payments found</td></tr>
                    ) : (
                      payRows.map((row, i) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #F8FAFC' }} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 text-[11px] text-slate-300">{(payPage - 1) * PAGE_SIZE + i + 1}</td>
                          <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-700">+91 {row.user_mobile}</td>
                          <td className="px-5 py-3.5 text-[13px] font-black" style={{ color: BLUE }}>₹{Number(row.amount).toLocaleString('en-IN')}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={row.status} /></td>
                          <td className="px-5 py-3.5 max-w-[180px]">
                            {row.campaign_slug ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-slate-500">?c={row.campaign_slug}</span>
                                {row.pixel_id && <span className="text-[9px] font-mono text-slate-400">{row.pixel_id}</span>}
                                {row.ad_account_id && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-block w-fit" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>{row.ad_account_id}</span>
                                )}
                              </div>
                            ) : <span className="text-[12px] text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3.5 max-w-[180px]">
                            {row.meta_campaign_id ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-block w-fit" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                  {row.meta_campaign_id}
                                </span>
                                {row.meta_campaign_name && (
                                  <span className="text-[10px] font-semibold text-slate-600">{row.meta_campaign_name}</span>
                                )}
                              </div>
                            ) : <span className="text-[12px] text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">{fmt(row.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {payTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <button onClick={() => setPayPage((p) => Math.max(1, p - 1))} disabled={payPage === 1 || payLoading}
                    className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold disabled:opacity-40"
                    style={{ border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569' }}>← Prev</button>
                  <span className="text-[11px] text-slate-400">Page {payPage}/{payTotalPages}</span>
                  <button onClick={() => setPayPage((p) => Math.min(payTotalPages, p + 1))} disabled={payPage === payTotalPages || payLoading}
                    className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold disabled:opacity-40"
                    style={{ border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569' }}>Next →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ MARKETING TAB ══ */}
        {tab === 'marketing' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex items-center gap-1 mb-5">
              {(['overview', 'meta'] as MktTab[]).map((t) => (
                <button key={t} onClick={() => setMktTab(t)}
                  className="px-4 py-1.5 rounded-[8px] text-[11px] font-bold tracking-wide transition-all"
                  style={{
                    background: mktTab === t ? BLUE_MD : '#F1F5F9',
                    border: `1.5px solid ${mktTab === t ? BLUE : '#E2E8F0'}`,
                    color: mktTab === t ? BLUE : '#64748B',
                  }}>
                  {t === 'overview' ? 'Overview' : 'Meta'}
                </button>
              ))}
            </div>

            {/* ── Overview ── */}
            {mktTab === 'overview' && (
              <>
                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap mb-5">
                  <button onClick={() => setMktAllTime((p) => !p)}
                    className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all"
                    style={{ background: mktAllTime ? '#EDE9FE' : '#F1F5F9', border: `1.5px solid ${mktAllTime ? '#8B5CF6' : '#E2E8F0'}`, color: mktAllTime ? '#6D28D9' : '#64748B' }}>
                    All time
                  </button>
                  {(['from', 'to'] as const).map((side) => (
                    <div key={side} className="relative flex items-center" style={{ opacity: mktAllTime ? 0.4 : 1 }}>
                      <svg className="absolute left-2.5 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <input type="date" disabled={mktAllTime}
                        value={side === 'from' ? mktFrom : mktTo}
                        max={side === 'from' ? mktTo : undefined}
                        min={side === 'to' ? mktFrom : undefined}
                        onChange={(e) => side === 'from' ? setMktFrom(e.target.value) : setMktTo(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-600 outline-none"
                        style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', cursor: mktAllTime ? 'not-allowed' : 'pointer' }} />
                      {side === 'from' && <span className="mx-1.5 text-[11px] font-semibold text-slate-400">to</span>}
                    </div>
                  ))}
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input value={mktSlug} onChange={(e) => setMktSlug(e.target.value)} placeholder="Search slug..." autoComplete="off"
                      className="pl-7 pr-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none"
                      style={{ background: mktSlug ? BLUE_LT : '#F8FAFC', border: `1.5px solid ${mktSlug ? BLUE : '#E2E8F0'}`, color: '#334155', width: 140 }} />
                  </div>
                  {mktSlug && (
                    <button onClick={() => setMktSlug('')}
                      className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                      style={{ border: '1.5px solid #E2E8F0' }}>Clear</button>
                  )}
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {mktLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-[14px] px-4 py-4 animate-pulse bg-slate-100" style={{ height: 80 }} />)
                  ) : [
                    { label: 'Purchases',   value: mktOverview?.total_purchases ?? '0', color: '#15803D', bg: '#F0FDF4' },
                    { label: 'CAPI Sent',   value: mktOverview?.capi_sent       ?? '0', color: BLUE,      bg: BLUE_LT   },
                    { label: 'CAPI Issues', value: mktOverview?.capi_issues     ?? '0', color: '#B91C1C', bg: '#FEF2F2' },
                  ].map((c) => (
                    <div key={c.label} className="rounded-[14px] px-4 py-4" style={{ background: c.bg, border: `1px solid ${c.color}22` }}>
                      <p className="text-[9px] font-bold uppercase tracking-[.15em] mb-1" style={{ color: c.color + 'AA' }}>{c.label}</p>
                      <p className="text-[22px] font-black leading-none" style={{ color: c.color }}>{c.value}</p>
                    </div>
                  ))}
                </div>

                {/* Tab switcher */}
                <div className="flex gap-2 mb-3">
                  {([{ key: 'campaign', label: 'By Campaign' }, { key: 'meta', label: 'By Meta Campaign' }] as const).map((t) => (
                    <button key={t.key} onClick={() => setBrkTab(t.key)}
                      className="px-4 py-1.5 rounded-[8px] text-[11px] font-bold transition-all"
                      style={{
                        background: brkTab === t.key ? BLUE : '#FFFFFF',
                        border: `1.5px solid ${brkTab === t.key ? BLUE : '#E2E8F0'}`,
                        color: brkTab === t.key ? '#FFFFFF' : '#64748B',
                        boxShadow: brkTab === t.key ? `0 4px 14px -4px ${BLUE}66` : 'none',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* By Campaign table */}
                {brkTab === 'campaign' && (
                  <div className="rounded-[14px] overflow-hidden mb-4" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
                    <div className="px-5 py-3" style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">By Campaign</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                            {['Campaign', 'Pixel / Ad Account', 'Purchases', 'CAPI', 'Issues'].map((h) => (
                              <th key={h} className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mktLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                {[120, 100, 50, 40, 40].map((w, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse bg-slate-100" style={{ width: w }} /></td>)}
                              </tr>
                            ))
                          ) : byPixel.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-[12px] text-slate-400">No data yet.</td></tr>
                          ) : byPixel.map((row) => (
                            <tr key={row.id} className="hover:bg-blue-50 transition-colors" style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td className="px-4 py-3">
                                <span className="text-[12px] font-bold text-slate-800 block">{row.label}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">?c={row.slug}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] text-slate-400 font-mono block">{row.pixel_id}</span>
                                {row.ad_account_id && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>{row.ad_account_id}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[13px] font-black text-slate-800">{row.purchases}</td>
                              <td className="px-4 py-3 text-[12px] font-bold" style={{ color: BLUE }}>{row.capi_sent}</td>
                              <td className="px-4 py-3">{Number(row.capi_issues) > 0 ? <span className="text-[12px] font-bold text-red-500">{row.capi_issues}</span> : <span className="text-[12px] text-slate-300">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* By Meta Campaign table */}
                {brkTab === 'meta' && (
                  <div className="rounded-[14px] overflow-hidden" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
                    <div className="px-5 py-3" style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">By Meta Campaign</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                            {['Meta Cmp Name / ID', 'Campaign', 'Pixel / Ad Account', 'Purchases', 'CAPI', 'Issues'].map((h) => (
                              <th key={h} className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mktLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                {[100, 120, 100, 50, 40, 40].map((w, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse bg-slate-100" style={{ width: w }} /></td>)}
                              </tr>
                            ))
                          ) : byMeta.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px] text-slate-400">No Meta campaign data yet.</td></tr>
                          ) : byMeta.map((row) => (
                            <tr key={row.meta_campaign_id} className="hover:bg-blue-50 transition-colors" style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td className="px-4 py-3">
                                <span className="text-[12px] font-bold text-slate-800 block">{row.meta_campaign_name ?? '—'}</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-block mt-0.5 w-fit" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{row.meta_campaign_id}</span>
                              </td>
                              <td className="px-4 py-3">
                                {row.campaign_slug ? (
                                  <>
                                    <span className="text-[12px] font-bold text-slate-800 block">{row.pixel_label ?? row.campaign_slug}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">?c={row.campaign_slug}</span>
                                  </>
                                ) : <span className="text-[12px] text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] text-slate-400 font-mono block">{row.pixel_id ?? '—'}</span>
                                {row.ad_account_id && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>{row.ad_account_id}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[13px] font-black text-slate-800">{row.purchases}</td>
                              <td className="px-4 py-3 text-[12px] font-bold" style={{ color: BLUE }}>{row.capi_sent}</td>
                              <td className="px-4 py-3">{Number(row.capi_issues) > 0 ? <span className="text-[12px] font-bold text-red-500">{row.capi_issues}</span> : <span className="text-[12px] text-slate-300">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Meta (Campaign CRUD) ── */}
            {mktTab === 'meta' && (
              <div className="space-y-4">
                {/* Add / Edit form */}
                {showPxForm && (
                  <div className="rounded-[14px] p-5" style={{ background: '#fff', border: `1.5px solid ${BLUE}` }}>
                    <p className="text-[12px] font-bold text-slate-700 mb-4">{editPx ? 'Edit Campaign' : 'New Campaign'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Label',   key: 'label',   placeholder: 'e.g. Summer Sale Campaign A', type: 'text' },
                        { label: 'Pixel ID',key: 'pixel_id',placeholder: '15-16 digit pixel ID',        type: 'text' },
                        { label: 'Ad Account ID (optional)', key: 'ad_account_id', placeholder: 'act_123456789', type: 'text' },
                      ].map(({ label, key, placeholder, type }) => (
                        <div key={key}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                          <input type={type} value={pxForm[key as keyof typeof pxForm]}
                            onChange={(e) => setPxForm((f) => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder} autoComplete="off"
                            className="w-full px-3 py-2 rounded-[8px] text-[12px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
                            style={{ border: '1.5px solid #E2E8F0', background: '#F8FAFC' }} />
                        </div>
                      ))}
                      {/* Slug — separate so we can auto-sanitize */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Slug <span className="normal-case font-normal text-slate-400">(?c=)</span>
                        </label>
                        <input value={pxForm.slug}
                          onChange={(e) => setPxForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                          placeholder="e.g. summer-sale-a" autoComplete="off"
                          className="w-full px-3 py-2 rounded-[8px] text-[12px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
                          style={{ border: '1.5px solid #E2E8F0', background: '#F8FAFC' }} />
                      </div>
                      {/* CAPI Token with show/hide */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">CAPI Access Token</label>
                        <div className="relative">
                          <input type={showToken ? 'text' : 'password'} value={pxForm.access_token}
                            onChange={(e) => setPxForm((f) => ({ ...f, access_token: e.target.value }))}
                            placeholder="EAAxxxxxxx..." autoComplete="new-password"
                            className="w-full px-3 py-2 pr-10 rounded-[8px] text-[12px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
                            style={{ border: '1.5px solid #E2E8F0', background: '#F8FAFC' }} />
                          <button type="button" onClick={() => setShowToken((p) => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showToken
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={handleSavePx} disabled={pxSaving || !pxForm.slug || !pxForm.label || !pxForm.pixel_id || !pxForm.access_token}
                        className="px-4 py-2 rounded-[8px] text-[11px] font-bold text-white disabled:opacity-50 transition-all"
                        style={{ background: BLUE }}>
                        {pxSaving ? 'Saving…' : editPx ? 'Update' : 'Create'}
                      </button>
                      <button onClick={() => { setShowPxForm(false); setEditPx(null); setPxForm(EMPTY_PX); }}
                        className="px-4 py-2 rounded-[8px] text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                        style={{ border: '1.5px solid #E2E8F0' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Campaign list */}
                <div className="rounded-[14px] overflow-hidden" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
                  <div className="px-5 py-3.5 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                    <p className="text-[11px] font-bold uppercase tracking-[.15em] text-slate-400">{pxTotal} Campaign{pxTotal !== 1 ? 's' : ''}</p>
                    <div className="relative">
                      <svg className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      <input value={pxSearch} onChange={(e) => { setPxSearch(e.target.value); setPxPage(1); }}
                        placeholder="Search slug, pixel, act…" autoComplete="off"
                        className="pl-6 pr-2 py-1 rounded-[6px] text-[10px] font-semibold outline-none"
                        style={{ background: pxSearch ? BLUE_LT : '#fff', border: `1.5px solid ${pxSearch ? BLUE : '#E2E8F0'}`, color: '#334155', width: 165 }} />
                    </div>
                    {!showPxForm && (
                      <button onClick={() => { setEditPx(null); setPxForm(EMPTY_PX); setShowToken(false); setShowPxForm(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold text-white transition-all ml-auto"
                        style={{ background: BLUE }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        New Campaign
                      </button>
                    )}
                  </div>

                  {pxLoading ? (
                    <div className="px-5 py-4 space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse bg-slate-100" />)}
                    </div>
                  ) : pixels.length === 0 ? (
                    <div className="px-5 py-10 text-center text-[12px] text-slate-400">No campaigns yet — create your first one.</div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
                      {pixels.map((px) => (
                        <div key={px.id} className="px-5 py-4">
                          {deleteConfirm === px.id ? (
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] text-red-500 font-semibold flex-1">Delete &quot;{px.label}&quot;?</span>
                              <button onClick={() => handleDeletePx(px.id)}
                                className="px-3 py-1.5 rounded-[7px] text-[11px] font-bold text-white"
                                style={{ background: '#DC2626' }}>Delete</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                                style={{ border: '1.5px solid #E2E8F0' }}>Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-[13px] font-bold text-slate-800">{px.label}</span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>{px.slug}</span>
                                  {px.ad_account_id && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>{px.ad_account_id}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-[11px] px-2 py-1 rounded-[6px] font-mono truncate select-all flex-1 min-w-0"
                                    style={{ background: BLUE_LT, color: BLUE, border: `1px solid ${BLUE_MD}` }}>
                                    {baseUrl}/?c={px.slug}&amp;meta_campaign_id={'{{campaign.id}}'}&amp;meta_campaign_name={'{{campaign.name}}'}
                                  </code>
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[5px]" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>Pixel: {px.pixel_id}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => copyLink(px.slug)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-[7px] text-[10px] font-bold transition-all"
                                  style={{ background: copied === px.slug ? '#F0FDF4' : BLUE_LT, color: copied === px.slug ? '#15803D' : BLUE, border: `1px solid ${copied === px.slug ? '#BBF7D0' : BLUE_MD}` }}>
                                  {copied === px.slug
                                    ? <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                                    : <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy</>}
                                </button>
                                <button onClick={() => { setEditPx(px); setPxForm({ slug: px.slug, label: px.label, pixel_id: px.pixel_id, access_token: '', ad_account_id: px.ad_account_id ?? '' }); setShowToken(false); setShowPxForm(true); }}
                                  className="px-2.5 py-1.5 rounded-[7px] text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                  style={{ border: '1.5px solid #E2E8F0' }}>Edit</button>
                                <button onClick={() => setDeleteConfirm(px.id)}
                                  className="px-2.5 py-1.5 rounded-[7px] text-[10px] font-bold transition-colors"
                                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA' }}>Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {pxTotalPages > 1 && (
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #F1F5F9' }}>
                      <button disabled={pxPage <= 1} onClick={() => setPxPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                        style={{ border: '1.5px solid #E2E8F0' }}>← Prev</button>
                      <span className="text-[11px] text-slate-400">Page {pxPage} / {pxTotalPages}</span>
                      <button disabled={pxPage >= pxTotalPages} onClick={() => setPxPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                        style={{ border: '1.5px solid #E2E8F0' }}>Next →</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
