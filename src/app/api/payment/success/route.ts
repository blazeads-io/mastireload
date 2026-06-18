import { NextRequest, NextResponse } from 'next/server';

// Legacy route kept for compatibility — GlobalPay uses /api/payment/callback
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  return NextResponse.redirect(`${appUrl}/subscription`, 303);
}

export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  return NextResponse.redirect(`${appUrl}/subscription`, 303);
}
