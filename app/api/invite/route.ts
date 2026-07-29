import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // 1. Verifikasi Admin
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== 'adm.gadingprinting@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized: Hanya admin yang dapat mengirim undangan.' }, { status: 403 });
    }

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi.' }, { status: 400 });
    }

    if (!process.env.FONNTE_TOKEN || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Sistem belum dikonfigurasi sepenuhnya (Cek Token di Vercel).' }, { status: 500 });
    }

    // 2. Generate Token & Simpan ke Database
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const inviteToken = Array.from(Array(24), () => Math.floor(Math.random() * 36).toString(36)).join('');

    const { error: dbError } = await supabaseAdmin
      .from('team_invites')
      .insert([{ phone, token: inviteToken, is_used: false }]);

    if (dbError) {
      console.error(dbError);
      return NextResponse.json({ error: 'Gagal membuat token undangan di database.' }, { status: 500 });
    }

    // 3. Kirim Pesan Fonnte
    const inviteLink = `https://tim-gilt.vercel.app/register?token=${inviteToken}`;
    const message = `Halo! 👋\n\nAnda telah diundang untuk bergabung ke Tim di *Logaritma Project Hub*.\n\nSilakan klik tautan rahasia berikut untuk melengkapi pendaftaran akun Anda:\n${inviteLink}\n\n_Pesan ini dikirim secara otomatis._`;

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': process.env.FONNTE_TOKEN },
      body: new URLSearchParams({ target: phone, message: message }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('Fonnte Error:', data);
      return NextResponse.json({ error: 'Gagal mengirim pesan WhatsApp via Fonnte.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Undangan berhasil dikirim!' }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
