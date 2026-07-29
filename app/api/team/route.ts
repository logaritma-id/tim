import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // 1. Verifikasi Admin Session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only di route handler
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Pastikan hanya admin yang diizinkan (adm.gadingprinting@gmail.com)
    if (!user || user.email !== 'adm.gadingprinting@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized: Hanya admin yang dapat mendaftarkan tim.' }, { status: 403 });
    }

    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, Password, dan Nama Lengkap wajib diisi.' }, { status: 400 });
    }

    // Pastikan SUPABASE_SERVICE_ROLE_KEY ada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.' }, { status: 500 });
    }

    // 2. Gunakan Admin Client untuk membuat user tanpa me-logout admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Bypass email verification
      user_metadata: {
        full_name: fullName
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
