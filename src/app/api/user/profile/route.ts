import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyUserToken } from '@/lib/userAuth';

export async function GET(req: NextRequest) {
  try {
    const userId = verifyUserToken(req.cookies.get('mr_token')?.value);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const res = await pool.query(
      `SELECT u.id, u.mobile, u.created_at,
              s.status AS sub_status, s.end_date,
              p.name AS plan_name, p.price AS plan_price, p.duration_days,
              GREATEST(0, CEIL(EXTRACT(EPOCH FROM (s.end_date - NOW())) / 86400))::int AS days_left
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active' AND s.end_date > NOW()
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE u.id = $1`,
      [userId],
    );

    if (res.rows.length === 0) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err) {
    console.error('profile error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
