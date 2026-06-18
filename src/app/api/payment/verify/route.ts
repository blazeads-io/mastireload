import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { activateSubscription } from '@/lib/activateSubscription';

function setCookies(res: NextResponse, token: string, maxAge: number, userId: string, mobile: string) {
  const opts = { path: '/', maxAge, sameSite: 'lax' as const, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  res.cookies.set('mr_has_sub', '1', opts);
  res.cookies.set('mr_token', token, opts);
  res.cookies.set('mr_uid', userId, { ...opts, httpOnly: false });
  res.cookies.set('mr_mob', mobile, { ...opts, httpOnly: false });
}

async function checkGlobalPayin(gpIntentId: string): Promise<{
  paid: boolean;
  gpTxnId: string | null;
  amount: number;
  raw: object;
} | null> {
  try {
    const apiKey = process.env.GLOBALPAYIN_API_KEY!;
    const res = await fetch(`https://app.globalpayin.com/api/payments/intents/${gpIntentId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const status  = String(data.data?.status ?? '').toLowerCase();
    const gpTxnId = data.data?.transactionId ?? null;
    const amount  = parseFloat(data.data?.amount ?? '0');

    return {
      paid:    status === 'success' || status === 'completed' || status === 'paid',
      gpTxnId,
      amount,
      raw:     data,
    };
  } catch (err) {
    console.error('GlobalPayin status check error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { txnId } = await req.json();

    if (!txnId) {
      return NextResponse.json({ success: false, message: 'txnId required' }, { status: 400 });
    }

    const payRes = await pool.query(
      `SELECT p.id, p.user_id, p.status, p.gp_intent_id, u.mobile
       FROM payments p JOIN users u ON u.id = p.user_id
       WHERE p.txn_id = $1`,
      [txnId],
    );

    if (payRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Payment record not found' });
    }

    const pay = payRes.rows[0];

    const buildResponse = (freshToken: string) => {
      const decoded  = Buffer.from(freshToken, 'base64').toString();
      const [uid]    = decoded.split(':');
      const response = NextResponse.json({ success: true });
      const maxAge   = 216000;
      setCookies(response, freshToken, maxAge, uid ?? String(pay.user_id), pay.mobile ?? '');
      return response;
    };

    // Fast path: callback already processed
    if (pay.status === 'success') {
      const freshToken = Buffer.from(`${pay.user_id}:${pay.mobile}:${Date.now()}`).toString('base64');
      return buildResponse(freshToken);
    }

    // Fallback: poll GlobalPayin directly
    if (!pay.gp_intent_id) {
      return NextResponse.json({ success: false, message: 'Payment not completed yet' });
    }

    const gpCheck = await checkGlobalPayin(pay.gp_intent_id);

    if (!gpCheck || !gpCheck.paid) {
      return NextResponse.json({ success: false, message: 'Payment not completed yet' });
    }

    const result = await activateSubscription(
      txnId,
      gpCheck.gpTxnId,
      gpCheck.raw,
      gpCheck.amount,
      '',
      '',
      req,
    );

    if (!result) {
      return NextResponse.json({ success: false, message: 'Activation failed' });
    }

    return buildResponse(result.freshToken);
  } catch (err) {
    console.error('payment/verify error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
