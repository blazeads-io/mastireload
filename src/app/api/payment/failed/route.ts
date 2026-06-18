import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const body   = await req.text();
    const params = Object.fromEntries(new URLSearchParams(body));
    const txnId  = params.txnid ?? params.orderId ?? params.transactionId;

    if (txnId) {
      await pool.query(
        `UPDATE payments SET status='failed', gateway_response=$1, updated_at=NOW()
         WHERE txn_id=$2 AND status='pending'`,
        [JSON.stringify(params), txnId],
      );
    }
  } catch (err) {
    console.error('payment/failed error:', err);
  }

  return NextResponse.redirect(`${appUrl}/subscription`, 303);
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  return NextResponse.redirect(`${appUrl}/subscription`, 303);
}
