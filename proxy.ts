import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 1. Nama fungsi diubah menjadi 'proxy' agar dikenali Next.js 16
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ===================================================================
  // 🚨 GALAXYTUS AI WAF (AUTONOMOUS WEB APPLICATION FIREWALL) 🚨
  // ===================================================================
  // Ambil IP penyerang dan path yang diakses
  const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'Unknown IP';
  const fullUrl = request.nextUrl.pathname + request.nextUrl.search;
  const decodedUrl = decodeURIComponent(fullUrl).toLowerCase();

  // Cek apakah ada aturan blokir dari AI di database
  const { data: blockedRules } = await supabase
    .from('ai_firewall_rules')
    .select('*')
    .eq('is_active', true);

  if (blockedRules && blockedRules.length > 0) {
    for (const rule of blockedRules) {
      // 1. Blokir berdasarkan IP Address
      if (rule.ip_address && clientIp.includes(rule.ip_address)) {
        return new NextResponse(
          `<html>
            <body style="background:#09090b; color:#ef4444; font-family:monospace; text-align:center; padding-top:10%;">
              <h1 style="font-size:3rem; margin-bottom:10px;"> BLOCKED BY GALAXYTUS AI</h1>
              <p style="font-size:1.2rem; color:#a1a1aa;">IP Address Anda (${clientIp}) telah di-blacklist oleh Agen Pertahanan Otonom kami.</p>
              <p style="background:#450a0a; display:inline-block; padding:10px 20px; border-radius:8px; margin-top:20px;">
                <b>Alasan:</b> ${rule.reason}
              </p>
            </body>
          </html>`,
          { status: 403, headers: { 'content-type': 'text/html' } }
        );
      }
      
      // 2. Blokir berdasarkan Pola Payload Berbahaya (Pattern/Regex)
      if (rule.pattern && decodedUrl.includes(rule.pattern.toLowerCase())) {
         return new NextResponse(
          `<html>
            <body style="background:#09090b; color:#10b981; font-family:monospace; text-align:center; padding-top:10%;">
              <h1 style="font-size:3rem; margin-bottom:10px;">AUTONOMOUS SHIELD ACTIVATED</h1>
              <p style="font-size:1.2rem; color:#a1a1aa;">Payload berbahaya terdeteksi dan dihancurkan sebelum mencapai server.</p>
              <p style="background:#064e3b; display:inline-block; padding:10px 20px; border-radius:8px; margin-top:20px;">
                <b>Pattern Matched:</b> ${rule.pattern}
              </p>
            </body>
          </html>`,
          { status: 403, headers: { 'content-type': 'text/html' } }
        );
      }
    }
  }
  // ===================================================================

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // --- LOGIKA SATPAM ROUTING NORMAL ---
  
  // 1. Daftar rute publik yang boleh diakses TANPA login
  const isPublicRoute = 
    url.pathname === '/' || // Landing Page Galaxytus AI
    url.pathname.startsWith('/login') || 
    url.pathname.startsWith('/register') || 
    url.pathname.startsWith('/forgot-password') || 
    url.pathname.startsWith('/reset-password') ||
    url.pathname.startsWith('/api'); // Supaya webhook & inngest tetap jalan

  // 2. Jika BELUM login dan mencoba akses rute rahasia, tendang ke /login
  if (!user && !isPublicRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. Jika SUDAH login tapi iseng buka halaman auth, arahkan ke dashboard
  if (user && (url.pathname.startsWith('/login') || url.pathname.startsWith('/register'))) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}