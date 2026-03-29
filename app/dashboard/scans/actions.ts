'use server'
import { Octokit } from "octokit"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from "next/cache"

export async function applyRemediation(formData: FormData) {
  const remediationId = formData.get('remediationId') as string
  const scanId = formData.get('scanId') as string

  if (!remediationId || !scanId) return

  const supabase = await createClient()

  // Ubah status di database menjadi 'applied'
  const { error } = await supabase
    .from('remediations')
    .update({ status: 'applied' })
    .eq('id', remediationId)

  if (error) {
    console.error("Gagal menerapkan patch:", error)
    throw new Error("Gagal menerapkan perbaikan")
  }

  // Refresh halaman agar UI berubah otomatis
  revalidatePath(`/dashboard/scans/${scanId}`)
}

export async function createGithubPR(formData: FormData) {
  const remediationId = formData.get('remediationId') as string
  const scanId = formData.get('scanId') as string
  const targetUrl = formData.get('targetUrl') as string
  const patchedCode = formData.get('patchedCode') as string
  
  // PERBAIKAN 1: Membersihkan filePath dari backslash (\) Windows dan slash (/) di awal
  const rawFilePath = formData.get('filePath') as string || "fixed-by-galaxytus.ts"
  const filePath = rawFilePath.replace(/\\/g, '/').replace(/^\/+/, '')

  if (!process.env.GITHUB_ACCESS_TOKEN) {
    throw new Error("GITHUB_ACCESS_TOKEN belum dipasang di .env.local")
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN })
  const supabase = await createClient()

  try {
    // PERBAIKAN 2: Hapus juga .git agar lebih aman kalau user masukin URL dengan akhiran .git
    const cleanUrl = targetUrl.replace("https://github.com/", "").replace(/\.git$/, "").replace(/\/$/, "")
    const [owner, repo] = cleanUrl.split("/")

    // 2. Dapatkan data branch utama (main/master)
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
    const defaultBranch = repoData.default_branch

    const { data: refData } = await octokit.rest.git.getRef({
      owner, repo, ref: `heads/${defaultBranch}`,
    })
    const baseSha = refData.object.sha

    // 3. Buat branch baru untuk AI dengan tambahan timestamp
    const timestamp = Date.now();
    const newBranchName = `galaxytus-fix-${remediationId.split('-')[0]}-${timestamp}`;

    await octokit.rest.git.createRef({
      owner, 
      repo, 
      ref: `refs/heads/${newBranchName}`, 
      sha: baseSha,
    });

    // 4. Cek apakah file yang mau diganti sudah ada (untuk mendapatkan SHA file lama)
    let fileSha = undefined
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner, repo, path: filePath, ref: newBranchName,
      })
      if (!Array.isArray(fileData)) fileSha = fileData.sha
    } catch (e) { /* File mungkin belum ada, tidak apa-apa */ }

    // 5. Commit & Push kode perbaikan ke branch baru
    await octokit.rest.repos.createOrUpdateFileContents({
      owner, repo, path: filePath,
      message: `Galaxytus AI: Auto-Remediation for ${filePath}`,
      content: Buffer.from(patchedCode).toString('base64'), // GitHub butuh format Base64
      branch: newBranchName,
      sha: fileSha, // Wajib diisi jika meng-update file yang sudah ada
    })

    // 6. Buka Pull Request!
    const { data: prData } = await octokit.rest.pulls.create({
      owner, repo,
      title: `Security Fix: Auto-Remediation by Galaxytus AI`,
      body: `Agen AI Galaxytus telah menemukan kerentanan dan menyusun kode perbaikan ini secara otomatis.\n\n**File yang diperbaiki:** \`${filePath}\`\n\nHarap di-review sebelum melakukan Merge.`,
      head: newBranchName,
      base: defaultBranch,
    })

    // 7. Update status di database kita
    await supabase.from('remediations').update({ 
      status: 'applied', 
      original_code: prData.html_url // Kita simpan link PR-nya di sini sebagai jejak
    }).eq('id', remediationId)

    revalidatePath(`/dashboard/scans/${scanId}`)
    return { success: true, prUrl: prData.html_url }

  } catch (error: any) {
    console.error("Gagal membuat PR:", error)
    throw new Error(`Gagal membuat Pull Request: ${error.message}`)
  }
}