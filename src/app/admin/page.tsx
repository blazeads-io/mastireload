'use client';

import { useState, useEffect, useCallback } from 'react';

const BLUE    = '#2563EB';
const BLUE_LT = '#EFF6FF';
const BLUE_MD = '#DBEAFE';
const PAGE_SIZE = 100;

async function adminLogout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin_auth';
}

type StatusFilter = 'all' | 'success' | 'pending' | 'failed';
type AdminTab = 'payments' | 'marketing' | 'mediaBuyers';
type MarketingTab = 'overview' | 'campaigns';

/* ── Types ─────────────────────────────────────────────── */
interface PaymentRow {
  user_id: number;
  user_number: string;
  user_payment: number;
  payment_status: 'success' | 'pending' | 'failed';
  date_time: string;
  txn_id: string;
  campaign_slug: string | null;
  media_buyer_name: string | null;
  pixel_id: string | null;
  ad_account_id: string | null;
  meta_campaign_id: string | null;
  meta_campaign_name: string | null;
}

interface Stats {
  total_payments: string;
  total_successful: string;
  total_pending: string;
  total_failed: string;
  total_users: string;
}

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  has_password: boolean;
  created_at: string;
}

interface Pixel {
  id: number;
  slug: string;
  label: string;
  pixel_id: string;
  access_token: string;
  ad_account_id: string | null;
  is_default: boolean;
  client_id: number | null;
  client_name: string | null;
}

interface MarketingOverview {
  total_purchases: string;
  capi_sent: string;
  capi_issues: string;
  organic: string;
}

interface PixelStat {
  id: number;
  slug: string;
  label: string;
  pixel_id: string;
  ad_account_id: string | null;
  is_default: boolean;
  client_id: number | null;
  client_name: string | null;
  purchases: string;
  capi_sent: string;
  capi_issues: string;
}

interface MetaCampaignStat {
  meta_campaign_id: string;
  meta_campaign_name: string | null;
  campaign_slug: string | null;
  pixel_label: string | null;
  pixel_id: string | null;
  ad_account_id: string | null;
  client_name: string | null;
  purchases: string;
  capi_sent: string;
  capi_issues: string;
}

/* ── Helpers ───────────────────────────────────────────── */
const STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  success: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Success' },
  pending: { bg: '#FEFCE8', color: '#A16207', border: '#FEF08A', label: 'Pending' },
  failed:  { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', label: 'Failed'  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', label: status };
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

const FILTER_TABS: { key: StatusFilter; label: string; color: string; bg: string; border: string }[] = [
  { key: 'all',     label: 'All',     color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
  { key: 'success', label: 'Success', color: '#15803D', bg: '#F0FDF4', border: '#86EFAC' },
  { key: 'pending', label: 'Pending', color: '#A16207', bg: '#FEFCE8', border: '#FDE047' },
  { key: 'failed',  label: 'Failed',  color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5' },
];

/* ── Shared styles ──────────────────────────────────────── */
const inputCls  = 'w-full px-3 py-2 rounded-[8px] text-[12px] text-slate-800 bg-white border outline-none transition-all focus:ring-2 focus:ring-blue-200';
const inputStyle = { borderColor: '#CBD5E1' };
const labelCls  = 'text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1';

const card = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 14,
};

/* ── Client Form ────────────────────────────────────────── */
const EMPTY_CLIENT = { name: '', email: '', password: '' };

function ClientForm({ initial = EMPTY_CLIENT, isEdit = false, onSave, onCancel, saving }: {
  initial?: typeof EMPTY_CLIENT;
  isEdit?: boolean;
  onSave: (data: typeof EMPTY_CLIENT) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm]         = useState(initial);
  const [showPass, setShowPass] = useState(false);
  const set = (k: keyof typeof EMPTY_CLIENT, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="rounded-[14px] p-5 mb-4" style={{ ...card, background: '#F8FAFC', border: `1.5px solid ${isEdit ? BLUE_MD : '#E2E8F0'}` }}>
      <p className="text-[13px] font-bold text-slate-800 mb-4">{isEdit ? 'Edit media buyer' : 'Add media buyer'}</p>

      {/* Row 1: name + email (email = login id) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Name <span style={{ color: BLUE }}>*</span></label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Rahul Sharma" autoFocus={!isEdit} autoComplete="off"
            className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={labelCls}>
            Email <span className="text-slate-300 font-normal normal-case tracking-normal">(used for portal login)</span>
          </label>
          <input value={form.email} onChange={(e) => set('email', e.target.value)}
            placeholder="rahul@example.com" type="email" autoComplete="off"
            className={inputCls} style={inputStyle} />
        </div>
      </div>

      {/* Row 2: password */}
      <div className="mb-4">
        <label className={labelCls}>
          Password{isEdit && <span className="text-slate-300 font-normal normal-case tracking-normal"> (leave blank to keep existing)</span>}
        </label>
        <div className="relative max-w-xs">
          <input value={form.password} onChange={(e) => set('password', e.target.value)}
            type={showPass ? 'text' : 'password'} autoComplete="new-password"
            placeholder={isEdit ? '••••••••' : 'Set login password'}
            className={inputCls + ' pr-9'} style={inputStyle} />
          <button type="button" onClick={() => setShowPass((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            {showPass
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            }
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
          className="px-4 py-2 rounded-[8px] text-[12px] font-bold text-white transition-all disabled:opacity-40"
          style={{ background: BLUE }}>
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-[8px] text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Pixel Form ─────────────────────────────────────────── */
const EMPTY_FORM = { slug: '', label: '', pixel_id: '', access_token: '', ad_account_id: '', client_id: '' };

function PixelForm({
  initial, onSave, onCancel, saving, clients,
}: {
  initial: typeof EMPTY_FORM;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  saving: boolean;
  clients: Client[];
}) {
  const [form, setForm]       = useState(initial);
  const [showToken, setShowToken] = useState(false);
  const set = (k: keyof typeof EMPTY_FORM, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.slug && form.label && form.pixel_id && form.access_token && form.client_id;

  return (
    <div className="rounded-[14px] p-5 mb-4" style={{ ...card, background: '#F8FAFC' }}>
      <p className="text-[13px] font-bold text-slate-800 mb-4">{initial.slug ? 'Edit pixel' : 'Add pixel'}</p>

      <div className="mb-3">
        <label className={labelCls}>User <span style={{ color: BLUE }}>*</span></label>
        <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}
          className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="" disabled>— select user —</option>
          {clients.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        {clients.length === 0 && (
          <p className="text-[10px] mt-1 text-red-500">No users yet — create a user first in the Users tab.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Slug (used in ?c=)</label>
          <input value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="e.g. summer-a" autoComplete="new-password" name="px-slug" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={labelCls}>Label</label>
          <input value={form.label} onChange={(e) => set('label', e.target.value)}
            placeholder="e.g. Summer Campaign A" autoComplete="new-password" name="px-label" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={labelCls}>Meta Pixel ID</label>
          <input value={form.pixel_id} onChange={(e) => set('pixel_id', e.target.value.trim())}
            placeholder="15-16 digit pixel id" autoComplete="new-password" name="px-pixel-id" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className={labelCls}>CAPI Access Token</label>
          <div className="relative">
            <input value={form.access_token} onChange={(e) => set('access_token', e.target.value.trim())}
              placeholder="System User token" type={showToken ? 'text' : 'password'} autoComplete="new-password" name="px-token"
              className={inputCls + ' pr-9'} style={inputStyle} />
            <button type="button" onClick={() => setShowToken((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showToken
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              }
            </button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Ad Account ID <span className="text-slate-300 font-normal normal-case tracking-normal">(optional)</span></label>
          <input value={form.ad_account_id} onChange={(e) => set('ad_account_id', e.target.value.trim())}
            placeholder="act_123456789" autoComplete="new-password" name="px-ad-account" className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onSave(form)} disabled={saving || !canSave}
          className="px-4 py-2 rounded-[8px] text-[12px] font-bold text-white transition-all disabled:opacity-40"
          style={{ background: BLUE }}>
          {saving ? 'Saving…' : 'Save pixel'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-[8px] text-[12px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Breakdown Table ────────────────────────────────────── */
function BreakdownTable({
  title, cols, loading, empty, emptyMsg, children,
}: {
  title: string; cols: string[]; loading: boolean;
  empty: boolean; emptyMsg: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] overflow-hidden" style={card}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
        <p className="text-[11px] font-bold uppercase tracking-[.15em] text-slate-400">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
              {cols.map((h) => (
                <th key={h} className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  {cols.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3.5 rounded animate-pulse bg-slate-100" style={{ width: j === 0 ? 100 : 40 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : empty ? (
              <tr><td colSpan={cols.length} className="px-4 py-6 text-center text-[12px] text-slate-400">{emptyMsg}</td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── MediaBuyers Panel ──────────────────────────────────── */
function MediaBuyersPanel() {
  const [clients, setClients]         = useState<Client[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editClient, setEditClient]   = useState<Client | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/clients');
    if (res.status === 401) { adminLogout(); return; }
    const json = await res.json();
    if (json.success) setClients(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function handleSave(form: typeof EMPTY_CLIENT) {
    setSaving(true);
    const res  = await fetch('/api/admin/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setShowForm(false); fetchClients(); }
    else { alert(json.message ?? 'Error saving media buyer'); }
  }

  async function handleUpdate(form: typeof EMPTY_CLIENT) {
    if (!editClient) return;
    setSaving(true);
    const res  = await fetch(`/api/admin/clients?id=${editClient.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setEditClient(null); fetchClients(); }
    else { alert(json.message ?? 'Error updating media buyer'); }
  }

  async function handleDelete(id: number) {
    const res  = await fetch(`/api/admin/clients?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) { setDeleteConfirm(null); fetchClients(); }
    else { alert(json.message ?? 'Delete failed'); }
  }

  return (
    <div className="fu">
      <div className="mb-4">
        <h2 className="text-[16px] font-bold text-slate-800">MediaBuyer</h2>
        <p className="text-[12px] text-slate-400 mt-0.5">Manage media buyers who own pixels and campaigns.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-slate-500">{clients.length} media buyer{clients.length !== 1 ? 's' : ''} registered</p>
        {!showForm && !editClient && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white shrink-0 transition-all hover:opacity-90"
            style={{ background: BLUE, boxShadow: `0 4px 14px -4px ${BLUE}88` }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New media buyer
          </button>
        )}
      </div>

      {showForm && (
        <ClientForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-[12px] animate-pulse bg-slate-100" />)}
        </div>
      ) : clients.length === 0 && !showForm ? (
        <div className="rounded-[14px] px-6 py-12 text-center" style={card}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: BLUE_LT }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2} strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-slate-500">No media buyers yet</p>
          <p className="text-[11px] text-slate-400 mt-1">Add one to start assigning pixels.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((cl) => (
            <div key={cl.id}>
              {/* Edit form — inline under the row */}
              {editClient?.id === cl.id ? (
                <ClientForm
                  initial={{ name: cl.name, email: cl.email ?? '', password: '' }}
                  isEdit
                  onSave={handleUpdate}
                  onCancel={() => setEditClient(null)}
                  saving={saving}
                />
              ) : (
                <div className="flex items-center gap-4 px-4 py-3.5 rounded-[12px] hover:shadow-sm transition-all"
                  style={card}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-[14px] text-white"
                    style={{ background: `linear-gradient(135deg,${BLUE},#60A5FA)` }}>
                    {cl.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-slate-800">{cl.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: cl.is_active ? '#F0FDF4' : '#F1F5F9', color: cl.is_active ? '#15803D' : '#64748B', border: `1px solid ${cl.is_active ? '#BBF7D0' : '#E2E8F0'}` }}>
                        {cl.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{ background: cl.has_password ? '#F0FDF4' : '#FEF2F2', color: cl.has_password ? '#15803D' : '#B91C1C', border: `1px solid ${cl.has_password ? '#BBF7D0' : '#FECACA'}` }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        {cl.has_password ? 'Password set' : 'No password'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                      {cl.email && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                          {cl.email}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-300">Added {formatDate(cl.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {deleteConfirm === cl.id ? (
                      <>
                        <span className="text-[11px] text-slate-500">Delete?</span>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold text-slate-500" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>No</button>
                        <button onClick={() => handleDelete(cl.id)} className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold text-white" style={{ background: '#DC2626' }}>Yes</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditClient(cl); setShowForm(false); setDeleteConfirm(null); }}
                          className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-colors"
                          style={{ background: BLUE_LT, color: BLUE, border: `1px solid ${BLUE_MD}` }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(cl.id)}
                          className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-colors"
                          style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Marketing Panel ────────────────────────────────────── */
function MarketingPanel() {
  const [tab, setTab]       = useState<MarketingTab>('overview');
  const [brkTab, setBrkTab] = useState<'campaign' | 'meta'>('campaign');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate]     = useState(todayStr);
  const [allTime, setAllTime]   = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [overviewSlugSearch, setOverviewSlugSearch] = useState('');
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [byPixel, setByPixel]             = useState<PixelStat[]>([]);
  const [byMetaCampaign, setByMetaCampaign] = useState<MetaCampaignStat[]>([]);
  const [clients, setClients]   = useState<Client[]>([]);
  const [pixels, setPixels]         = useState<Pixel[]>([]);
  const [adAccountFilter, setAdAccountFilter]     = useState('');
  const [pixelClientFilter, setPixelClientFilter] = useState('');
  const [pixelSlugSearch, setPixelSlugSearch]     = useState('');
  const [pxList, setPxList]                       = useState<Pixel[]>([]);
  const [pxListPage, setPxListPage]               = useState(1);
  const [pxListTotalPages, setPxListTotalPages]   = useState(1);
  const [pxListTotal, setPxListTotal]             = useState(0);
  const [pxListLoading, setPxListLoading]         = useState(false);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingPixels, setLoadingPixels] = useState(true);
  const [showPixelForm, setShowPixelForm] = useState(false);
  const [editPixel, setEditPixel]         = useState<Pixel | null>(null);
  const [saving, setSaving]               = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [copiedSlug, setCopiedSlug]       = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? '');

  const metaUrl = (slug: string) =>
    `${baseUrl}/?c=${slug}&meta_campaign_id={{campaign.id}}&meta_campaign_name={{campaign.name}}`;

  function copyLink(slug: string) {
    const url = metaUrl(slug);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  }

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/admin/clients');
    if (res.status === 401) { adminLogout(); return; }
    const json = await res.json();
    if (json.success) setClients(json.data);
  }, []);

  const fetchStats = useCallback(async (from: string, to: string, clientId: string, slugSearch: string, adAccount: string) => {
    setLoadingStats(true);
    const params = new URLSearchParams();
    if (from)       params.set('from', from);
    if (to)         params.set('to', to);
    if (clientId)   params.set('client_id', clientId);
    if (slugSearch) params.set('slug_search', slugSearch);
    if (adAccount)  params.set('ad_account_id', adAccount);
    const res = await fetch(`/api/admin/marketing?${params}`);
    if (res.status === 401) { adminLogout(); return; }
    const json = await res.json();
    if (json.success) {
      setOverview(json.overview);
      setByPixel(json.by_pixel);
      setByMetaCampaign(json.by_meta_campaign ?? []);
    }
    setLoadingStats(false);
  }, []);

  const fetchPixels = useCallback(async () => {
    setLoadingPixels(true);
    const res = await fetch('/api/admin/pixels');
    if (res.status === 401) { adminLogout(); return; }
    const json = await res.json();
    if (json.success) setPixels(json.data);
    setLoadingPixels(false);
  }, []);

  const fetchPxList = useCallback(async (search: string, clientId: string, page: number) => {
    setPxListLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(search && { search }), ...(clientId && { client_id: clientId }) });
    const res = await fetch(`/api/admin/pixels?${params}`);
    if (res.status === 401) { adminLogout(); return; }
    const json = await res.json();
    if (json.success) { setPxList(json.data); setPxListTotal(json.total); setPxListTotalPages(json.totalPages); }
    setPxListLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => {
    fetchStats(allTime ? '' : fromDate, allTime ? '' : toDate, selectedClient, overviewSlugSearch, adAccountFilter);
  }, [fromDate, toDate, allTime, selectedClient, overviewSlugSearch, adAccountFilter, fetchStats]);
  useEffect(() => { fetchPixels(); }, [fetchPixels]);
  useEffect(() => { if (tab === 'campaigns') fetchPxList(pixelSlugSearch, pixelClientFilter, pxListPage); }, [tab, pixelSlugSearch, pixelClientFilter, pxListPage, fetchPxList]);

  async function handleSavePixel(form: typeof EMPTY_FORM) {
    setSaving(true);
    const body = {
      slug: form.slug, label: form.label, pixel_id: form.pixel_id,
      access_token: form.access_token, ad_account_id: form.ad_account_id || null,
      is_default: false, client_id: form.client_id,
    };
    console.log('[handleSavePixel] body:', JSON.stringify({ ...body, access_token: '***' }));
    const url    = editPixel ? `/api/admin/pixels/${editPixel.id}` : '/api/admin/pixels';
    const method = editPixel ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json   = await res.json();
    console.log('[handleSavePixel] response:', JSON.stringify(json));
    setSaving(false);
    if (json.success) {
      setShowPixelForm(false); setEditPixel(null);
      fetchPixels();
      fetchPxList(pixelSlugSearch, pixelClientFilter, pxListPage);
      fetchStats(allTime ? '' : fromDate, allTime ? '' : toDate, selectedClient, overviewSlugSearch, adAccountFilter);
    } else { alert(json.message ?? 'Error saving pixel'); }
  }

  async function handleDeletePixel(id: number) {
    const res  = await fetch(`/api/admin/pixels/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setDeleteConfirm(null); fetchPixels();
      fetchPxList(pixelSlugSearch, pixelClientFilter, pxListPage);
      fetchStats(allTime ? '' : fromDate, allTime ? '' : toDate, selectedClient, overviewSlugSearch, adAccountFilter);
    } else { alert(json.message ?? 'Delete failed'); }
  }

  const statCards = overview
    ? [
        { label: 'Purchases',   value: overview.total_purchases, color: '#15803D', bg: '#F0FDF4', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { label: 'CAPI Sent',   value: overview.capi_sent,       color: '#1D4ED8', bg: BLUE_LT,   icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'CAPI Issues', value: overview.capi_issues,     color: '#B91C1C', bg: '#FEF2F2', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { label: 'Organic (No Pixel)', value: overview.organic,  color: '#475569', bg: '#F8FAFC', icon: 'M12 4.5c-4.5 0-8 3.5-8 7.5s3.5 7.5 8 7.5 8-3.5 8-7.5-3.5-7.5-8-7.5zm0 0v15M4 12h16' },
      ]
    : [];

  return (
    <div>
      {/* Sub-tab nav */}
      <div className="flex items-center gap-1 mb-6">
        {(['overview', 'campaigns'] as MarketingTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-[8px] text-[11px] font-bold tracking-wide transition-all"
            style={{
              background: tab === t ? BLUE_MD : '#F1F5F9',
              border: `1.5px solid ${tab === t ? BLUE : '#E2E8F0'}`,
              color: tab === t ? BLUE : '#64748B',
            }}>
            {t === 'campaigns' ? 'Meta' : 'Overview'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <button onClick={() => setAllTime((p) => !p)}
              className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all"
              style={{
                background: allTime ? '#EDE9FE' : '#F1F5F9',
                border: `1.5px solid ${allTime ? '#8B5CF6' : '#E2E8F0'}`,
                color: allTime ? '#6D28D9' : '#64748B',
              }}>
              All time
            </button>

            {(['from', 'to'] as const).map((side) => (
              <div key={side} className="relative flex items-center" style={{ opacity: allTime ? 0.4 : 1, transition: 'opacity .2s' }}>
                <svg className="absolute left-2.5 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <input type="date"
                  value={side === 'from' ? fromDate : toDate}
                  max={side === 'from' ? toDate : undefined}
                  min={side === 'to' ? fromDate : undefined}
                  disabled={allTime}
                  onChange={(e) => side === 'from' ? setFromDate(e.target.value) : setToDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', cursor: allTime ? 'not-allowed' : 'pointer' }}
                />
                {side === 'from' && <span className="mx-1.5 text-[11px] font-semibold text-slate-400">to</span>}
              </div>
            ))}

            <select value={selectedClient} onChange={(e) => { setSelectedClient(e.target.value); setAdAccountFilter(''); }}
              className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none focus:ring-2 focus:ring-blue-200"
              style={{
                background: selectedClient ? BLUE_LT : '#F8FAFC',
                border: `1.5px solid ${selectedClient ? BLUE : '#E2E8F0'}`,
                color: selectedClient ? BLUE : '#64748B',
                cursor: 'pointer',
              }}>
              <option value="">All MediaBuyers</option>
              {clients.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>

            {/* Ad Account filter — scoped to selected media buyer */}
            {(() => {
              const filteredPixels = selectedClient
                ? pixels.filter((p) => String(p.client_id) === selectedClient)
                : pixels;
              return filteredPixels.some((p) => p.ad_account_id) ? (
                <select value={adAccountFilter} onChange={(e) => setAdAccountFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                  style={{
                    background: adAccountFilter ? '#FFF7ED' : '#F8FAFC',
                    border: `1.5px solid ${adAccountFilter ? '#F97316' : '#E2E8F0'}`,
                    color: adAccountFilter ? '#C2410C' : '#64748B',
                    cursor: 'pointer',
                  }}>
                  <option value="">All Ad Accounts</option>
                  {[...new Set(filteredPixels.map((p) => p.ad_account_id).filter((a): a is string => !!a))].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              ) : null;
            })()}

            {/* Slug search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                value={overviewSlugSearch}
                onChange={(e) => setOverviewSlugSearch(e.target.value)}
                placeholder="Search slug, pixel, act…"
                autoComplete="off"
                className="pl-7 pr-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                style={{
                  background: overviewSlugSearch ? BLUE_LT : '#F8FAFC',
                  border: `1.5px solid ${overviewSlugSearch ? BLUE : '#E2E8F0'}`,
                  color: '#334155',
                  width: 175,
                }}
              />
            </div>

            {(selectedClient || overviewSlugSearch || adAccountFilter) && (
              <button onClick={() => { setSelectedClient(''); setOverviewSlugSearch(''); setAdAccountFilter(''); }}
                className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                style={{ border: '1.5px solid #E2E8F0' }}>
                Clear
              </button>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {loadingStats
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-[14px] px-4 py-4 animate-pulse bg-slate-100" style={{ height: 80 }} />
                ))
              : statCards.map((c) => (
                  <div key={c.label} className="rounded-[14px] px-4 py-4 flex items-center gap-3" style={{ background: c.bg, border: `1px solid ${c.color}22` }}>
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: c.color + '18' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth={2} strokeLinecap="round"><path d={c.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.15em] mb-0.5" style={{ color: c.color + 'AA' }}>{c.label}</p>
                      <p className="text-[22px] font-black leading-none" style={{ color: c.color }}>{c.value}</p>
                    </div>
                  </div>
                ))}
          </div>

          <div className="flex flex-col gap-4">
            {/* Tab switcher */}
            <div className="flex gap-2">
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

            {brkTab === 'campaign' && (
              <BreakdownTable title="By Campaign" cols={['Campaign', 'MediaBuyer', 'Pixel / Ad Account', 'Purchases', 'CAPI', 'Issues']}
                loading={loadingStats} empty={byPixel.length === 0} emptyMsg="No pixels configured yet.">
                {byPixel.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50 transition-colors" style={{ borderBottom: '1px solid #F8FAFC' }}>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-bold text-slate-800 block">{row.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">?c={row.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      {row.client_name
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: BLUE_LT, color: BLUE, border: `1px solid ${BLUE_MD}` }}>{row.client_name}</span>
                        : <span className="text-[12px] text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-400 font-mono block">{row.pixel_id}</span>
                      {row.ad_account_id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
                          {row.ad_account_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-black text-slate-800">{row.purchases}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-blue-600">{row.capi_sent}</td>
                    <td className="px-4 py-3">
                      {Number(row.capi_issues) > 0
                        ? <span className="text-[12px] font-bold text-red-500">{row.capi_issues}</span>
                        : <span className="text-[12px] text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </BreakdownTable>
            )}

            {brkTab === 'meta' && (
              <BreakdownTable title="By Meta Campaign" cols={['Meta Cmp Name / ID', 'Campaign', 'MediaBuyer', 'Pixel / Ad Account', 'Purchases', 'CAPI', 'Issues']}
                loading={loadingStats} empty={byMetaCampaign.length === 0} emptyMsg="No Meta campaign data yet.">
                {byMetaCampaign.map((row) => (
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
                      {row.client_name
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: BLUE_LT, color: BLUE, border: `1px solid ${BLUE_MD}` }}>{row.client_name}</span>
                        : <span className="text-[12px] text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-400 font-mono block">{row.pixel_id ?? '—'}</span>
                      {row.ad_account_id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
                          {row.ad_account_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-black text-slate-800">{row.purchases}</td>
                    <td className="px-4 py-3 text-[12px] font-bold text-blue-600">{row.capi_sent}</td>
                    <td className="px-4 py-3">
                      {Number(row.capi_issues) > 0
                        ? <span className="text-[12px] font-bold text-red-500">{row.capi_issues}</span>
                        : <span className="text-[12px] text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </BreakdownTable>
            )}
          </div>
        </>
      )}

      {/* ── PIXELS TAB ── */}
      {tab === 'campaigns' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select
              value={pixelClientFilter}
              onChange={(e) => { setPixelClientFilter(e.target.value); setPxListPage(1); }}
              className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none focus:ring-2 focus:ring-blue-200"
              style={{
                background: pixelClientFilter ? BLUE_LT : '#FFFFFF',
                border: `1.5px solid ${pixelClientFilter ? BLUE : '#E2E8F0'}`,
                color: pixelClientFilter ? BLUE : '#94A3B8',
                cursor: clients.length === 0 ? 'not-allowed' : 'pointer',
              }}
              disabled={clients.length === 0}
            >
              <option value="">{clients.length === 0 ? 'No MediaBuyers' : 'All MediaBuyers'}</option>
              {clients.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>

            {/* Slug search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                value={pixelSlugSearch}
                onChange={(e) => { setPixelSlugSearch(e.target.value); setPxListPage(1); }}
                placeholder="Search slug, pixel, act…"
                className="pl-7 pr-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                style={{
                  background: pixelSlugSearch ? BLUE_LT : '#FFFFFF',
                  border: `1.5px solid ${pixelSlugSearch ? BLUE : '#E2E8F0'}`,
                  color: '#334155',
                  width: 175,
                }}
                autoComplete="off"
              />
            </div>

            {(pixelClientFilter || pixelSlugSearch) && (
              <button onClick={() => { setPixelClientFilter(''); setPixelSlugSearch(''); setPxListPage(1); }}
                className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                style={{ border: '1.5px solid #E2E8F0' }}>
                Clear
              </button>
            )}

            {!showPixelForm && !editPixel && (
              <button onClick={() => setShowPixelForm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-bold text-white shrink-0 transition-all hover:opacity-90 ml-auto"
                style={{ background: BLUE, boxShadow: `0 4px 14px -4px ${BLUE}88` }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                New pixel
              </button>
            )}
          </div>

          {showPixelForm && (
            <PixelForm initial={EMPTY_FORM} onSave={handleSavePixel} onCancel={() => setShowPixelForm(false)} saving={saving} clients={clients} />
          )}
          {editPixel && (
            <PixelForm
              initial={{ slug: editPixel.slug, label: editPixel.label, pixel_id: editPixel.pixel_id,
                access_token: editPixel.access_token, ad_account_id: editPixel.ad_account_id ?? '',
                client_id: editPixel.client_id ? String(editPixel.client_id) : '' }}
              onSave={handleSavePixel} onCancel={() => setEditPixel(null)} saving={saving} clients={clients}
            />
          )}

          {pxListLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-[12px] animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : pxList.length === 0 && !showPixelForm ? (
            <p className="text-[13px] text-slate-400 py-6">No pixels configured yet. Add one to start tracking.</p>
          ) : (
            <div className="space-y-2">
              {pxList.map((px) => (
                <div key={px.id} className="flex items-center gap-4 px-4 py-3.5 rounded-[12px] hover:shadow-sm transition-all"
                  style={card}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-slate-800">{px.label}</span>
                      {px.is_default && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: BLUE_MD, color: BLUE }}>DEFAULT</span>
                      )}
                      {px.client_name && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>{px.client_name}</span>
                      )}
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>{px.slug}</span>
                    </div>

                    {/* Full campaign link with copy */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="text-[11px] px-2 py-1 rounded-[6px] font-mono truncate max-w-xs sm:max-w-sm md:max-w-md select-all"
                        style={{ background: BLUE_LT, color: BLUE, border: `1px solid ${BLUE_MD}` }}>
                        {baseUrl}/?c={px.slug}&amp;meta_campaign_id={'{{campaign.id}}'}&amp;meta_campaign_name={'{{campaign.name}}'}
                      </code>
                      <button
                        onClick={() => copyLink(px.slug)}
                        title="Copy link"
                        className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-[10px] font-bold shrink-0 transition-all"
                        style={{
                          background: copiedSlug === px.slug ? '#F0FDF4' : BLUE_LT,
                          color: copiedSlug === px.slug ? '#15803D' : BLUE,
                          border: `1px solid ${copiedSlug === px.slug ? '#BBF7D0' : BLUE_MD}`,
                        }}>
                        {copiedSlug === px.slug ? (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        Pixel: {px.pixel_id}
                      </span>
                      {px.ad_account_id && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
                          Act: {px.ad_account_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {deleteConfirm === px.id ? (
                      <>
                        <span className="text-[11px] text-slate-500">Delete?</span>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold text-slate-500" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>No</button>
                        <button onClick={() => handleDeletePixel(px.id)} className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold text-white" style={{ background: '#DC2626' }}>Yes</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditPixel(px); setShowPixelForm(false); }}
                          className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>Edit</button>
                        <button onClick={() => setDeleteConfirm(px.id)}
                          className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-colors"
                          style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {pxListTotalPages > 1 && (
            <div className="mt-3 flex items-center justify-between px-1">
              <button disabled={pxListPage <= 1} onClick={() => setPxListPage(p => p - 1)}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                style={{ border: '1.5px solid #E2E8F0' }}>← Prev</button>
              <span className="text-[11px] text-slate-400">Page {pxListPage} / {pxListTotalPages} · {pxListTotal} total</span>
              <button disabled={pxListPage >= pxListTotalPages} onClick={() => setPxListPage(p => p + 1)}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                style={{ border: '1.5px solid #E2E8F0' }}>Next →</button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ── Main Admin Dashboard ───────────────────────────────── */
export default function AdminDashboard() {
  const [adminTab, setAdminTab]             = useState<AdminTab>('payments');
  const [rows, setRows]                     = useState<PaymentRow[]>([]);
  const [stats, setStats]                   = useState<Stats | null>(null);
  const [page, setPage]                     = useState(1);
  const [total, setTotal]                   = useState(0);
  const [loading, setLoading]               = useState(true);
  const [logoutConfirm, setLogoutConfirm]   = useState(false);
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('success');
  const [fromDate, setFromDate]             = useState(todayStr);
  const [toDate, setToDate]                 = useState(todayStr);
  const [allTime, setAllTime]               = useState(false);
  const [mediaBuyerFilter, setMediaBuyerFilter] = useState('');
  const [slugFilter, setSlugFilter]             = useState('');
  const [filterClients, setFilterClients]       = useState<Client[]>([]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchData = useCallback(async (
    pg: number, status: StatusFilter, from: string, to: string, isAllTime: boolean, clientId: string, slug: string,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pg), status,
        ...(!isAllTime && from && { from }),
        ...(!isAllTime && to   && { to   }),
        ...(clientId && { client_id: clientId }),
        ...(slug     && { slug_search: slug }),
      });
      const res = await fetch(`/api/admin/data?${params}`);
      if (res.status === 401) { adminLogout(); return; }
      const json = await res.json();
      if (json.success) { setRows(json.data); setStats(json.stats); setTotal(json.total); }
    } catch { adminLogout(); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (adminTab === 'payments') fetchData(page, statusFilter, fromDate, toDate, allTime, mediaBuyerFilter, slugFilter);
  }, [page, statusFilter, fromDate, toDate, allTime, mediaBuyerFilter, slugFilter, adminTab, fetchData]);

  useEffect(() => {
    fetch('/api/admin/clients')
      .then((r) => r.json())
      .then((json) => { if (json.success) setFilterClients(json.data); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin_auth';
  };

  const statCards = stats ? [
    { label: 'Total Users',    value: stats.total_users,      color: BLUE,      bg: BLUE_LT,   icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    { label: 'Total Payments', value: stats.total_payments,   color: '#475569',  bg: '#F8FAFC', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Successful',     value: stats.total_successful, color: '#15803D',  bg: '#F0FDF4', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Pending',        value: stats.total_pending,    color: '#A16207',  bg: '#FEFCE8', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Failed',         value: stats.total_failed,     color: '#B91C1C',  bg: '#FEF2F2', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ] : [];

  return (
    <main className="min-h-[100dvh]" style={{ background: '#F1F5F9', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }
        input[type="date"]:focus { outline: none; }
        select option { background: #fff; color: #1e293b; }
        tr:hover td { background: #EFF6FF !important; transition: background .12s; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: `linear-gradient(135deg,${BLUE},#60A5FA)` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span className="text-[14px] font-bold text-slate-900">Masti Reload</span>
            <span className="ml-2 text-[9px] font-bold uppercase tracking-[.15em] px-1.5 py-0.5 rounded-full" style={{ background: BLUE_LT, color: BLUE, border: `1px solid ${BLUE_MD}` }}>Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!logoutConfirm ? (
            <button onClick={() => setLogoutConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>Logout</button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Sure?</span>
              <button onClick={() => setLogoutConfirm(false)} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>No</button>
              <button onClick={handleLogout} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white" style={{ background: '#DC2626' }}>Yes</button>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">

        {/* Main tab nav */}
        <div className="flex items-center gap-1.5 mb-6 fu">
          {([
            { key: 'payments',    label: 'Payments',    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
            { key: 'marketing',   label: 'Marketing',   icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
            { key: 'mediaBuyers', label: 'MediaBuyer',  icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
          ] as { key: AdminTab; label: string; icon: string }[]).map((t) => (
            <button key={t.key} onClick={() => setAdminTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-bold transition-all"
              style={{
                background: adminTab === t.key ? BLUE : '#FFFFFF',
                border: `1.5px solid ${adminTab === t.key ? BLUE : '#E2E8F0'}`,
                color: adminTab === t.key ? '#FFFFFF' : '#64748B',
                boxShadow: adminTab === t.key ? `0 4px 14px -4px ${BLUE}66` : 'none',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PAYMENTS TAB ── */}
        {adminTab === 'payments' && (
          <>
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 fu">
                {statCards.map((c) => (
                  <div key={c.label} className="rounded-[14px] px-4 py-3.5 flex items-center gap-3" style={{ background: c.bg, border: `1px solid ${c.color}22` }}>
                    <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: c.color + '18' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth={2} strokeLinecap="round"><path d={c.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.12em] mb-0.5" style={{ color: c.color + '99' }}>{c.label}</p>
                      <p className="text-[18px] font-black leading-none" style={{ color: c.color }}>{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-[18px] overflow-hidden fu" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', animationDelay: '.06s', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {FILTER_TABS.map((tab) => {
                    const active = statusFilter === tab.key;
                    return (
                      <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                        className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wide transition-all"
                        style={{
                          background: active ? tab.bg : '#FFFFFF',
                          border: `1.5px solid ${active ? tab.border : '#E2E8F0'}`,
                          color: active ? tab.color : '#94A3B8',
                        }}>
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="hidden sm:block w-px h-5 self-center bg-slate-200" />

                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setAllTime((p) => !p); setPage(1); }}
                    className="px-3 py-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wide transition-all"
                    style={{
                      background: allTime ? '#EDE9FE' : '#FFFFFF',
                      border: `1.5px solid ${allTime ? '#8B5CF6' : '#E2E8F0'}`,
                      color: allTime ? '#6D28D9' : '#94A3B8',
                    }}>
                    All Time
                  </button>

                  {['from', 'to'].map((side) => (
                    <div key={side} className="relative flex items-center" style={{ opacity: allTime ? 0.35 : 1, transition: 'opacity .2s' }}>
                      <svg className="absolute left-2.5 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      <input type="date"
                        value={side === 'from' ? fromDate : toDate}
                        max={side === 'from' ? toDate : undefined}
                        min={side === 'to' ? fromDate : undefined}
                        disabled={allTime}
                        onChange={(e) => { side === 'from' ? setFromDate(e.target.value) : setToDate(e.target.value); setPage(1); }}
                        className="pl-8 pr-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-slate-600 outline-none"
                        style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', cursor: allTime ? 'not-allowed' : 'pointer' }} />
                      {side === 'from' && <span className="mx-1 text-[11px] font-semibold text-slate-400">to</span>}
                    </div>
                  ))}
                </div>

                <>
                  <div className="hidden sm:block w-px h-5 self-center bg-slate-200" />
                  <select
                    value={mediaBuyerFilter}
                    onChange={(e) => { setMediaBuyerFilter(e.target.value); setPage(1); }}
                    className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                    style={{
                      background: mediaBuyerFilter ? BLUE_LT : '#FFFFFF',
                      border: `1.5px solid ${mediaBuyerFilter ? BLUE : '#E2E8F0'}`,
                      color: mediaBuyerFilter ? BLUE : '#94A3B8',
                      cursor: filterClients.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                    disabled={filterClients.length === 0}
                  >
                    <option value="">{filterClients.length === 0 ? 'No MediaBuyers' : 'All MediaBuyers'}</option>
                    <option value="organic">Organic (No Pixel)</option>
                    {filterClients.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                      value={slugFilter}
                      onChange={(e) => { setSlugFilter(e.target.value); setPage(1); }}
                      placeholder="Search slug…"
                      autoComplete="off"
                      className="pl-7 pr-3 py-1.5 rounded-[8px] text-[11px] font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                      style={{
                        background: slugFilter ? BLUE_LT : '#FFFFFF',
                        border: `1.5px solid ${slugFilter ? BLUE : '#E2E8F0'}`,
                        color: '#334155',
                        width: 130,
                      }}
                    />
                  </div>
                </>

                <span className="ml-auto text-[11px] text-slate-400 hidden sm:block">
                  {total} results · Page {page}/{totalPages || 1}
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                      {['SN', 'User ID', 'Mobile', 'Amount', 'Status', 'MediaBuyer', 'Campaign', 'Meta Cmp Name / ID', 'Date & Time'].map((h) => (
                        <th key={h} className="px-5 py-3 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          {[30, 60, 110, 55, 70, 90, 160, 140, 130].map((w, j) => (
                            <td key={j} className="px-5 py-3.5">
                              <div className="h-4 rounded-lg animate-pulse bg-slate-100" style={{ width: w }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={9} className="px-5 py-10 text-center text-[13px] text-slate-400">No payments found</td></tr>
                    ) : (
                      rows.map((row, i) => (
                        <tr key={`${row.user_id}-${row.txn_id}-${i}`} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background .12s' }}>
                          <td className="px-5 py-3.5"><span className="text-[12px] font-semibold text-slate-300">{(page - 1) * PAGE_SIZE + i + 1}</span></td>
                          <td className="px-5 py-3.5"><span className="text-[12px] font-bold text-slate-400">#{row.user_id}</span></td>
                          <td className="px-5 py-3.5"><span className="text-[13px] font-semibold text-slate-800">+91 {row.user_number}</span></td>
                          <td className="px-5 py-3.5"><span className="text-[13px] font-black" style={{ color: STATUS_CFG[row.payment_status]?.color ?? '#475569' }}>₹{Number(row.user_payment).toLocaleString('en-IN')}</span></td>
                          <td className="px-5 py-3.5"><StatusBadge status={row.payment_status} /></td>
                          <td className="px-5 py-3.5">
                            {row.media_buyer_name ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: BLUE_LT, color: BLUE, border: `1px solid ${BLUE_MD}` }}>
                                {row.media_buyer_name}
                              </span>
                            ) : (
                              <span className="text-[12px] text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 max-w-[180px]">
                            {row.campaign_slug ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-mono font-semibold text-slate-700">{row.campaign_slug}</span>
                                {row.pixel_id && (
                                  <span className="text-[9px] font-mono text-slate-400">Pixel: {row.pixel_id}</span>
                                )}
                                {row.ad_account_id && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-block w-fit" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
                                    {row.ad_account_id}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[12px] text-slate-300">—</span>
                            )}
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
                            ) : (
                              <span className="text-[12px] text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5"><span className="text-[11px] text-slate-400">{formatDate(row.date_time)}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-bold transition-all disabled:opacity-30"
                    style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#64748B' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                    Prev
                  </button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pg: number;
                      if (totalPages <= 7)             pg = i + 1;
                      else if (page <= 4)              pg = i + 1;
                      else if (page >= totalPages - 3) pg = totalPages - 6 + i;
                      else                             pg = page - 3 + i;
                      return (
                        <button key={pg} onClick={() => setPage(pg)}
                          className="w-8 h-8 rounded-[8px] text-[12px] font-bold transition-all"
                          style={{
                            background: pg === page ? BLUE : '#FFFFFF',
                            border: pg === page ? 'none' : '1.5px solid #E2E8F0',
                            color: pg === page ? 'white' : '#64748B',
                            boxShadow: pg === page ? `0 4px 12px -2px ${BLUE}55` : 'none',
                          }}>
                          {pg}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-bold transition-all disabled:opacity-30"
                    style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#64748B' }}>
                    Next
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── MARKETING TAB ── */}
        {adminTab === 'marketing' && (
          <div className="fu">
            <div className="mb-4">
              <h2 className="text-[16px] font-bold text-slate-800">Marketing</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Pixels, attribution, and conversion analytics.</p>
            </div>
            <MarketingPanel />
          </div>
        )}

        {/* ── MEDIABUYER TAB ── */}
        {adminTab === 'mediaBuyers' && (
          <MediaBuyersPanel />
        )}
      </div>
    </main>
  );
}
