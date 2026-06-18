import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateUserToken } from '@/lib/userAuth';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { mobile, campaignSlug = '', metaCampaignId = '', metaCampaignName = '', fbp: bodyFbp = '', fbc: bodyFbc = '' } = await req.json();

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Invalid mobile number' }, { status: 400 });
    }

    // _fbp/_fbc come automatically in request cookies — use those, fallback to body values
    const fbp = req.cookies.get('_fbp')?.value || bodyFbp || '';
    const fbc = req.cookies.get('_fbc')?.value || bodyFbc || '';

    // Save first-touch attribution (campaign + fbp/fbc) — only if not unresolved Meta template
    if (campaignSlug && !campaignSlug.includes('{{')) {
      try {
        await pool.query(
          `INSERT INTO phone_attributions (mobile, campaign_slug, meta_campaign_id, meta_campaign_name, fbp, fbc)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (mobile) DO UPDATE SET
             campaign_slug      = EXCLUDED.campaign_slug,
             meta_campaign_id   = EXCLUDED.meta_campaign_id,
             meta_campaign_name = EXCLUDED.meta_campaign_name,
             fbp                = EXCLUDED.fbp,
             fbc                = EXCLUDED.fbc`,
          [
            mobile,
            campaignSlug,
            metaCampaignId && !metaCampaignId.includes('{{') ? metaCampaignId : null,
            metaCampaignName && !metaCampaignName.includes('{{') ? metaCampaignName : null,
            fbp || null,
            fbc || null,
          ],
        );
      } catch (attrErr) {
        console.error('phone_attributions save error:', attrErr);
      }
    }

    // Check if this mobile already has an active subscription
    const subCheck = await pool.query(
      `SELECT s.id, s.end_date FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE u.mobile = $1 AND s.status = 'active' AND s.end_date > NOW()
       LIMIT 1`,
      [mobile],
    );

    if (subCheck.rows.length > 0) {
      // Subscribed user — send OTP to verify identity
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await pool.query(`UPDATE otps SET is_used = true WHERE mobile = $1 AND is_used = false`, [mobile]);
      await pool.query(`INSERT INTO otps (mobile, otp, expires_at) VALUES ($1, $2, $3)`, [mobile, otp, expiresAt]);

      const smsUrl = `https://api.authkey.io/request?authkey=${process.env.OTP_AUTHKEY}&mobile=${mobile}&country_code=91&sid=${process.env.OTP_SID}&otp=${otp}`;
      const smsRes = await fetch(smsUrl);
      if (!smsRes.ok) {
        return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
      }

      return NextResponse.json({ success: true, isSubscribed: true });
    }

    // Unsubscribed user — upsert user, set auth token, send to subscription page
    const userRes = await pool.query(
      `INSERT INTO users (mobile) VALUES ($1)
       ON CONFLICT (mobile) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [mobile],
    );
    const userId: number = userRes.rows[0].id;
    const token = generateUserToken(userId, 60 * 60 * 24 * 3); // 3 days

    const response = NextResponse.json({ success: true, isSubscribed: false });
    response.cookies.set('mr_token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 3,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
    response.cookies.set('mr_has_sub', '0', {
      path: '/',
      maxAge: 60 * 60 * 24 * 3,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (err) {
    console.error('send-otp error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
