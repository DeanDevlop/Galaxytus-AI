'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FolderGit2, Plus, Globe, GitBranch, Download, ShieldAlert, Trash2 } from "lucide-react"
import { toast } from "sonner" 
import { verifyDomain, triggerScan } from './actions'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select(`
        id, name, description, source_type, target_url, created_at, is_verified, verification_token,
        organizations!inner (
          organization_members!inner (user_id)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (data) setProjects(data)
    setLoading(false)
  }

  const handleDownloadToken = (token: string) => {
    const element = document.createElement("a");
    const file = new Blob([token], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${token}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleVerify = async (id: string, url: string, token: string) => {
      const toastId = toast.loading("Memverifikasi Kepemilikan...")
      const result = await verifyDomain(id, url, token)
      
      if (result.success) {
         toast.success("Verifikasi Berhasil!", { id: toastId, description: "Akses pemindaian AI dibuka." })
         setTimeout(() => window.location.reload(), 1500)
      } else {
         toast.error("Verifikasi Gagal", { id: toastId, description: result.message })
      }
  }

  const handleScanJob = async (id: string, url: string, type: string) => {
      console.log(` [UI] Tombol Scan Ditekan untuk Project ID: ${id}`);
      
      // Gunakan toast.loading agar user tahu proses sedang berjalan
      const toastId = toast.loading("Mengaktifkan Agen AI...", { description: "Menghubungi server..." })
      
      try {
        console.log(" [UI] Menunggu balasan dari triggerScan...");
        const result = await triggerScan(id, url, type);
        
        console.log(" [UI] Balasan diterima:", result);

        if (result.success) {
           toast.success("Scan AI Dimulai!", { id: toastId, description: "Tugas pemindaian telah masuk antrean Inngest." });
           // Opsional: Redirect ke halaman detail scan agar user bisa melihat prosesnya
           // window.location.href = `/dashboard/scans` 
        } else {
           // TAMPILKAN ERROR ASLINYA KE LAYAR!
           toast.error("Gagal Memulai Scan", { id: toastId, description: result.message || "Terjadi kesalahan di server." });
         
        }
      } catch (error) {
        // TANGKAP ERROR JARINGAN ATAU CRASH FATAL
        console.error(" [UI] ERROR FATAL JARINGAN/API:", error);
        toast.error("Terjadi Kesalahan Fatal", { id: toastId, description: "Gagal terhubung ke sistem keamanan." });
      }
  }

  // FUNGSI HAPUS PROJECT
  const handleDelete = async (id: string) => {
      const toastId = toast.loading("Menghapus proyek...")
      const { deleteProject } = await import('./actions')
      const result = await deleteProject(id)

      if (result.success) {
         toast.success("Proyek Dihapus", { id: toastId, description: "Proyek beserta riwayatnya berhasil dilenyapkan." })
         loadProjects() // Refresh tabel tanpa reload halaman
      } else {
         toast.error("Gagal Menghapus", { id: toastId, description: result.message })
      }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects Target</h1>
          <p className="text-zinc-500">Kelola target aplikasi atau repository yang akan di-scan oleh AI.</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New Project
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Proyek Anda</CardTitle>
          <CardDescription>Semua target yang terdaftar di workspace ini.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <p className="text-center py-10 text-zinc-500">Memuat data proyek...</p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <FolderGit2 className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold">Belum ada proyek</h3>
              <p className="text-zinc-500 max-w-sm mt-2 mb-6">
                Tambahkan URL web atau repository untuk mulai.
              </p>
              <Link href="/dashboard/projects/new">
                <Button><Plus className="mr-2 h-4 w-4" /> Buat Proyek Pertama</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Proyek</TableHead>
                  <TableHead>Tipe Target</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead className="text-right w-[300px]">Aksi & Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                      <p className="text-xs text-zinc-500 font-normal mt-1">{project.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize flex w-fit items-center gap-1">
                        {project.source_type === 'web_url' ? <Globe className="h-3 w-3" /> : <GitBranch className="h-3 w-3" />}
                        {project.source_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-600 text-sm">
                      {project.target_url}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {project.is_verified ? (
                          <>
                            <Badge className="bg-emerald-100 text-emerald-700 border-none shadow-none">Verified</Badge>
                            <Button onClick={() => handleScanJob(project.id, project.target_url, project.source_type)} variant="default" size="sm" className="bg-zinc-900">
                              Scan AI
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none shadow-none hover:bg-yellow-200">Unverified</Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50">
                                  Verifikasi
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-yellow-500" /> Verifikasi Kepemilikan
                                  </DialogTitle>
                                  <DialogDescription>
                                    Buktikan bahwa Anda memiliki akses ke target ini.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="bg-zinc-50 border rounded-lg p-4 mt-2">
                                  <p className="text-sm font-semibold mb-2">1. Unduh File Token</p>
                                  <Button onClick={() => handleDownloadToken(project.verification_token)} variant="outline" size="sm" className="w-full bg-white mb-4">
                                    <Download className="w-4 h-4 mr-2" /> Download ({project.verification_token}.txt)
                                  </Button>
                                  <p className="text-sm font-semibold mb-2">2. Unggah ke Root Server</p>
                                  <Button onClick={() => handleVerify(project.id, project.target_url, project.verification_token)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold">
                                    Verifikasi Saya Sekarang
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        {/* TOMBOL DELETE ALA VERCEL */}
                        <DeleteProjectModal project={project} onConfirm={handleDelete} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// KOMPONEN KHUSUS: MODAL DELETE VERCEL STYLE
// ==========================================
function DeleteProjectModal({ project, onConfirm }: { project: any, onConfirm: (id: string) => void }) {
  const [confirmText, setConfirmText] = useState("")
  // Tombol hanya aktif jika teks yang diketik sama persis dengan nama proyek
  const isMatch = confirmText === project.name

  return (
    <Dialog>
      <DialogTrigger asChild>
         <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1">
            <Trash2 className="w-4 h-4" />
         </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
         <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
               <Trash2 className="w-5 h-5" /> Hapus Proyek
            </DialogTitle>
            <DialogDescription className="text-zinc-600 mt-2">
               Tindakan ini tidak dapat dibatalkan. Proyek ini beserta seluruh riwayat pemindaian AI-nya akan dihapus permanen.
            </DialogDescription>
         </DialogHeader>

         <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded p-4 my-4">
            <p className="text-sm text-red-800 dark:text-red-400 mb-3">
               Ketik <strong className="select-all bg-red-200 dark:bg-red-900 px-1 rounded">{project.name}</strong> untuk mengonfirmasi.
            </p>
            <input
               type="text"
               className="flex h-10 w-full rounded-md border border-red-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 font-mono"
               value={confirmText}
               onChange={(e) => setConfirmText(e.target.value)}
               placeholder={project.name}
            />
         </div>

         <Button
            variant="destructive"
            disabled={!isMatch}
            onClick={() => {
               onConfirm(project.id)
               setConfirmText("") 
            }}
            className="w-full font-bold"
         >
            Ya, Hapus Permanen
         </Button>
      </DialogContent>
    </Dialog>
  )
}