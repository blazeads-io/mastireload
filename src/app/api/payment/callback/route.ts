import { NextRequest, NextResponse } from 'next/server';
import { activateSubscription } from '@/lib/activateSubscription';

function setCookies(res: NextResponse, token: string, maxAge: number, userId: string, mobile: string) {
  const opts = { path: '/', maxAge, sameSite: 'lax' as const, httpOnly: true, secure: process.env.NODE_ENV === 'production' };
  res.cookies.set('mr_has_sub', '1', opts);
  res.cookies.set('mr_token', token, opts);
  res.cookies.set('mr_uid', userId, { ...opts, httpOnly: false });
  res.cookies.set('mr_mob', mobile, { ...opts, httpOnly: false });
}

// GlobalPayin redirects user here after payment
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const { searchParams } = new URL(req.url);

  const txnId   = searchParams.get('orderId') ?? searchParams.get('txnid') ?? searchParams.get('merchantOrderId') ?? '';
  const status  = String(searchParams.get('status') ?? '').toLowerCase();
  const gpTxnId = searchParams.get('transactionId') ?? searchParams.get('paymentId') ?? null;

  if (!txnId || status !== 'success') {
    return NextResponse.redirect(`${appUrl}/subscription`, 303);
  }

  try {
    const amount = parseFloat(searchParams.get('amount') ?? '0') || 0;
    const result = await activateSubscription(txnId, gpTxnId, Object.fromEntries(searchParams), amount, '', '', req);

    if (!result) {
      return NextResponse.redirect(`${appUrl}/subscription`, 303);
    }

    const decoded  = Buffer.from(result.freshToken, 'base64').toString();
    const [uid, mobile] = decoded.split(':');
    const successUrl = `${appUrl}/?mr_purchase=1&txnid=${encodeURIComponent(txnId)}&amount=${encodeURIComponent(searchParams.get('amount') ?? '0')}`;
    const res        = NextResponse.redirect(successUrl, 303);
    const secsLeft   = Math.ceil((result.newEndDate.getTime() - Date.now()) / 1000);
    setCookies(res, result.freshToken, secsLeft > 0 ? secsLeft : 216000, uid ?? '', mobile ?? '');
    return res;
  } catch (err) {
    console.error('payment/callback GET error:', err);
    return NextResponse.redirect(`${appUrl}/subscription`, 303);
  }
}
