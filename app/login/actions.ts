'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
export async function login(formData: FormData) {
  // 3. Tambahkan 'await' di sini
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?message=Email atau password salah')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // --- LOGIKA KAWAT BERDURI (VALIDASI PASSWORD KETAT) ---
  
  // 1. Cek Panjang Minimal (8 karakter)
  if (password.length < 8) {
    return redirect('/register?message=Password harus minimal 8 karakter.')
  }

  // 2. Cek Huruf Besar & Kecil
  if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
    return redirect('/register?message=Password harus mengandung huruf besar dan kecil.')
  }

  // 3. Cek Angka
  if (!/(?=.*\d)/.test(password)) {
    return redirect('/register?message=Password harus mengandung setidaknya satu angka.')
  }

  // 4. Cek Karakter Spesial (Simbol)
  if (!/(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?~`|\\/-])/.test(password)) {
    return redirect('/register?message=Password harus mengandung setidaknya satu simbol khusus.')
  }

  // Jika lolos semua ujian di atas, baru kita daftarkan ke Supabase
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error("Signup Error:", error.message)
    // Tampilkan pesan error asli dari Supabase jika email sudah terdaftar, dll
    return redirect(`/register?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
export async function logout() {
  const supabase = await createClient()
  
  // Hapus sesi user di database dan cookie browser
  await supabase.auth.signOut()
  
  // Refresh layout agar state user hilang
  revalidatePath('/', 'layout')
  
  // Tendang user kembali ke halaman login
  redirect('/login')
}
export async function loginWithGithub() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      // Setelah berhasil login di GitHub, arahkan kembali ke jalur ini:
      redirectTo: `${origin}/api/auth/callback`, 
    },
  })

  if (error) {
    console.error("GitHub Login Error:", error.message)
    return redirect('/login?message=Gagal terhubung dengan GitHub')
  }

  // Supabase akan mengembalikan URL halaman persetujuan GitHub
  if (data.url) {
    redirect(data.url)
  }
}

// ... (fungsi login, signup, dsb tetap ada)

export async function resetPasswordRequest(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = (await headers()).get('origin')

  // ANTI-ENUMERATION MEASURE:
  // Jangan pernah memberi tahu user jika email TIDAK terdaftar.
  // Selalu kembalikan pesan "sukses" agar attacker tidak bisa nge-scan database kita.
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Arahkan token ke rute callback rahasia kita, BUKAN langsung ke halaman ganti password
    redirectTo: `${origin}/api/auth/reset-callback`,
  })

  if (error) {
    // Log di server untuk investigasi, tapi jangan bocorkan ke frontend
    console.error("Critical: Reset Password Engine Failure ->", error.message)
  }

  // Pesan ambigu yang aman secara sekuritas
  return redirect('/forgot-password?message=Jika email terdaftar, instruksi pemulihan telah dikirim.')
}

export async function updatePasswordExecute(formData: FormData) {
  const supabase = await createClient()
  const newPassword = formData.get('password') as string

  // LOGIKA KAWAT BERDURI (Wajib sama persis dengan aturan Register)
  if (newPassword.length < 8 || 
      !/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword) || 
      !/(?=.*\d)/.test(newPassword) || 
      !/(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?~`|\\/-])/.test(newPassword)) {
    return redirect('/reset-password?message=Password gagal memenuhi standar keamanan minimum.')
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error("Critical: Password Update Failure ->", error.message)
    return redirect(`/reset-password?message=Sesi pemulihan tidak valid atau kadaluarsa.`)
  }

  // Jika sukses, hancurkan sesi dan paksa login ulang untuk memutus token
  await supabase.auth.signOut()
  return redirect('/login?message=Kredensial berhasil diperbarui. Silakan otentikasi ulang.')
}