import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // TUKAR KODE: Mengubah One-Time Code dari email menjadi Temporary Secure Session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Jika berhasil menukar token, arahkan user ke Vault (Halaman Ganti Password)
      return NextResponse.redirect(`${origin}/reset-password`)
    }
    
    console.error("Security Alert: Invalid Reset Token Attempt", error.message)
  }

  // Jika tidak ada kode atau kode kadaluarsa (manipulasi URL)
  return NextResponse.redirect(`${origin}/login?message=Tautan pemulihan telah dimanipulasi atau kadaluarsa.`)
}