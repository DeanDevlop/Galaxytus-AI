'use server'

import { randomUUID } from 'crypto'
import { inngest } from '@/inngest/client' 
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Ambil data sesi user yang sedang login
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error: userSyncError } = await supabase.from('users').upsert({ id: user.id })
  if (userSyncError) console.error("Gagal sinkronisasi user:", userSyncError)

  // 2. Cek apakah user sudah punya Workspace
  let { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let orgId = orgMember?.organization_id

  // 3. Logika Pembuatan Workspace Cerdas (Idempotent)
  if (!orgId) {
    const expectedSlug = `personal-${user.id.substring(0, 8)}`

    // Cek DULU apakah Workspace-nya sebenarnya sudah ada
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', expectedSlug)
      .maybeSingle()

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      // --- PERBAIKAN ARSITEKTUR RLS ---
      // Kita buat ID sendiri di sini, jadi kita tidak butuh .select() dari Supabase!
      const generatedOrgId = randomUUID()

      const { error: orgError } = await supabase
        .from('organizations')
        .insert({ 
          id: generatedOrgId, // Paksa masukkan ID buatan kita
          name: 'Personal Workspace', 
          slug: expectedSlug
        })
        // HAPUS .select().single() agar tidak kena blokir RLS Select!

      if (orgError) throw new Error(`Gagal membuat workspace: ${orgError.message}`)
      
      orgId = generatedOrgId // Gunakan ID yang kita buat tadi
    }

    // Insert ke member (sekarang aman karena kita sudah punya orgId dan RLS diizinkan)
    const { error: memberError } = await supabase.from('organization_members').upsert({
      organization_id: orgId,
      user_id: user.id,
      role: 'owner'
    })

    if (memberError) throw new Error(`Gagal menambahkan member: ${memberError.message}`)
  }

  // 4. Ambil data dari Form UI
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const sourceType = formData.get('sourceType') as string
  const targetUrl = formData.get('targetUrl') as string
  const verificationToken = `glx-${randomUUID().split('-')[0]}`

  // 5. Insert Proyek Baru ke Supabase
  const { error } = await supabase.from('projects').insert({
    organization_id: orgId,
    name,
    description,
    source_type: sourceType,
    target_url: targetUrl,
    is_verified: false, 
    verification_token: verificationToken 
  })

  if (error) {
    console.error(error)
    redirect('/dashboard/projects/new?error=Gagal menyimpan proyek')
  }

  // 6. Refresh cache Next.js dan kembalikan ke list proyek
  revalidatePath('/dashboard/projects')
  redirect('/dashboard/projects')
}
// ==========================================
// FUNGSI: TRIGGER SCAN DENGAN LIMIT HARIAN
// ==========================================
// ==========================================
// FUNGSI: TRIGGER SCAN (ANTI-RLS BYPASS)
// ==========================================
export async function triggerScan(projectId: string, targetUrl: string, sourceType: string) {
  const supabase = await createClient()
  
  // Impor randomUUID (pastikan di atas file ada: import { randomUUID } from 'crypto')
  const { randomUUID } = await import('crypto');

  // 1. CEK LIMIT 3 SCAN PER HARI
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString());

  if (countError) {
    return { success: false, message: "Gagal mengecek kuota." }
  }

  // Ingat tadi kodenya count >= 10, aku kembalikan ke batas wajar (misal 5 buat testing)
  if (count !== null && count >= 5) {
    return { 
      success: false, 
      message: "Kuota Habis! Anda telah menggunakan batas maksimal scan gratis hari ini." 
    };
  }

  // 2. JIKA KUOTA AMAN, LANJUT BUAT SCAN BARU DENGAN ID MANUAL
  const generatedScanId = randomUUID();

  const { error } = await supabase
    .from('scans')
    .insert({
      id: generatedScanId, // Paksa ID dari kita
      project_id: projectId,
      status: 'queued' // Menunggu Inngest mengambil alih
    })
    // HAPUS .select().single() agar tidak kena blokir RLS Select!

  if (error) {
    return { success: false, message: "Gagal membuat scan di database: " + error.message }
  }

  // 3. BANGUNKAN AGEN AI (INNGEST)
  try {
    const { inngest } = await import('@/inngest/client') 
    await inngest.send({
      name: "scan.start",
      data: { scanId: generatedScanId, targetUrl, sourceType } // Gunakan ID yang kita buat
    })
    
    return { success: true }
  } catch (inngestError) {
     console.error("Inngest gagal mengirim event:", inngestError);
     return { success: false, message: "Sistem AI background gagal dihidupkan." }
  }
}
// ==========================================
// FUNGSI 3: VERIFIKASI KEPEMILIKAN DOMAIN & GITHUB
// ==========================================
export async function verifyDomain(projectId: string, targetUrl: string, token: string) {
  const supabase = await createClient()

  try {
    let verifyUrls = [];

    // DETEKSI GITHUB vs WEB BIASA
    if (targetUrl.includes('github.com')) {
      // Ubah URL github.com/owner/repo menjadi raw.githubusercontent.com/owner/repo/main/token.txt
      const cleanTarget = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
      const urlParts = cleanTarget.replace("https://", "").replace("http://", "").split("/");
      const owner = urlParts[1];
      const repo = urlParts[2];
      
      if (!owner || !repo) return { success: false, message: "URL GitHub tidak valid." };

      // Kita buat 2 kemungkinan URL karena branch utama bisa 'main' atau 'master'
      verifyUrls.push(`https://raw.githubusercontent.com/${owner}/${repo}/main/${token}.txt`);
      verifyUrls.push(`https://raw.githubusercontent.com/${owner}/${repo}/master/${token}.txt`);
    } else {
      // URL Website Biasa
      const cleanUrl = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
      verifyUrls.push(`${cleanUrl}/${token}.txt`);
    }

    let isSuccess = false;
    let textContent = "";

    // Coba kunjungi URL tersebut (loop dipakai jika ada opsi main/master branch)
    for (const url of verifyUrls) {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        textContent = await response.text();
        isSuccess = true;
        break; // Berhenti mencari jika sudah ketemu
      }
    }

    if (!isSuccess) {
      return { success: false, message: "File verifikasi tidak ditemukan di server (404)." }
    }

    // Cek apakah isi file teksnya benar-benar mengandung token kita
    if (textContent.trim() === token) {
      await supabase.from('projects').update({ is_verified: true }).eq('id', projectId)
      return { success: true, message: "Target berhasil diverifikasi!" }
    } else {
      return { success: false, message: "File ditemukan, tapi isinya tidak cocok dengan token." }
    }
  } catch (error) {
    return { success: false, message: "Gagal menghubungi server target. Pastikan URL valid." }
  }
}
export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  
  // Hapus dari database (jika ada relasi tabel, Supabase otomatis menghapusnya berkat Cascade)
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  
  if (error) {
    return { success: false, message: "Gagal menghapus: " + error.message }
  }
  
  return { success: true }
}