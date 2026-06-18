import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyUserToken } from '@/lib/userAuth';

export async function POST(req: NextRequest) {
  try {
    const userId = verifyUserToken(req.cookies.get('mr_token')?.value);
    if (!userId)
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );

    const body = await req.json();
    const { planId } = body;
    // _fbp/_fbc from request cookies are most reliable — fallback to body values
    let fbp: string = req.cookies.get('_fbp')?.value || body.fbp || '';
    let fbc: string = req.cookies.get('_fbc')?.value || body.fbc || '';
    let campaignSlug: string = body.campaignSlug ?? '';
    let metaCampaignId: string | null = body.metaCampaignId ?? null;
    let metaCampaignName: string | null = body.metaCampaignName ?? null;

    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'planId required' },
        { status: 400 },
      );
    }

    const [planRes, userRes] = await Promise.all([
      pool.query(
        `SELECT id, name, price FROM plans WHERE id = $1 AND is_active = true`,
        [planId],
      ),
      pool.query(`SELECT id, mobile FROM users WHERE id = $1`, [userId]),
    ]);

    if (planRes.rows.length === 0)
      return NextResponse.json(
        { success: false, message: 'Plan not found' },
        { status: 404 },
      );
    if (userRes.rows.length === 0)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      );

    const plan = planRes.rows[0];
    const user = userRes.rows[0];

    // Fallback to stored first-touch attribution if current session has no campaign
    if (!campaignSlug && user.mobile) {
      const attrRes = await pool.query(
        `SELECT campaign_slug, meta_campaign_id, meta_campaign_name, fbp, fbc FROM phone_attributions WHERE mobile = $1`,
        [user.mobile],
      );
      if (attrRes.rows.length > 0) {
        const attr = attrRes.rows[0];
        campaignSlug = attr.campaign_slug || campaignSlug;
        metaCampaignId = attr.meta_campaign_id || metaCampaignId;
        metaCampaignName = attr.meta_campaign_name || metaCampaignName;
        if (!fbp && attr.fbp) fbp = attr.fbp;
        if (!fbc && attr.fbc) fbc = attr.fbc;
      }
    }

    const txnId = `MR${Date.now()}${userId}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const apiKey = process.env.GLOBALPAYIN_API_KEY!;

    const gpRes = await fetch(
      'https://app.globalpayin.com/api/payments/intents',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'INR',
          description: plan.name,
          customerEmail: `${user.mobile}@mastireload.com`,
          customerPhone: user.mobile,
          customerName: `User${userId}`,
          paymentMethod: 'upi',
          callbackUrl: `${appUrl}/api/payment/callback`,
          metadata: {
            orderId: txnId,
            userId: String(userId),
            planId: String(planId),
            fbp,
            fbc,
          },
        }),
      },
    );

    const gpData = await gpRes.json();
    // console.log('GlobalPayin response:', gpData);

    const intentUrl =
      gpData.intentUrl ??
      gpData.data?.intentUrl ??
      gpData.data?.providerPaymentUrl;
    const gpIntentId =
      gpData.data?.transactionId ?? gpData.transactionId ?? null;

    if (!intentUrl) {
      return NextResponse.json(
        {
          success: false,
          message: gpData.message ?? gpData.error ?? 'Payment init failed',
        },
        { status: 400 },
      );
    }

    // Use native qrString from gateway, or fall back to intentUrl so QR always shows
    const qrString = gpData.data?.qrString ?? intentUrl;
    const qrCode = gpData.data?.qrCode ?? null;

    await pool.query(
      `INSERT INTO payments (user_id, plan_id, txn_id, amount, status, campaign_slug, gp_intent_id, fbp, fbc, meta_campaign_id, meta_campaign_name)
       VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,$10)`,
      [
        userId,
        planId,
        txnId,
        plan.price,
        campaignSlug || null,
        gpIntentId,
        fbp,
        fbc,
        metaCampaignId,
        metaCampaignName,
      ],
    );

    return NextResponse.json({
      success: true,
      data: {
        txnId,
        paymentUrl: intentUrl,
        qrCode,
        qrString: qrString ?? null,
        amount: plan.price,
        expiresAt: gpData.data?.expiresAt ?? null,
      },
    });
  } catch (err) {
    console.error('payment/initiate error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 },
    );
  }
}
