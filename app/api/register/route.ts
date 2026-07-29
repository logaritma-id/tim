import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, token } = await request.json();

    if (!email || !password || !fullName || !token) {
      return NextResponse.json({ error: 'Data pendaftaran tidak lengkap.' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Verifikasi Token
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .eq('is_used', false)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json({ error: 'Token undangan tidak valid atau sudah kadaluarsa.' }, { status: 403 });
    }

    // 2. Buat User
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    // 3. Update Token is_used = true
    await supabaseAdmin
      .from('team_invites')
      .update({ is_used: true })
      .eq('token', token);

    return NextResponse.json({ success: true, user: userData.user }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
