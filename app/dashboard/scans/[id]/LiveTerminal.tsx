'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Terminal, Loader2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LiveTerminal({ scanId, initialStatus, initialAction }: { scanId: string, initialStatus: string, initialAction: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [action, setAction] = useState(initialAction || "Mempersiapkan agen...")
  const [status, setStatus] = useState(initialStatus)
  const [dots, setDots] = useState("")

  useEffect(() => {
    // Animasi titik-titik loading
    const dotInterval = setInterval(() => setDots(p => p.length >= 3 ? "" : p + "."), 500)
    
    // Polling ke database setiap 2 detik
    const fetchInterval = setInterval(async () => {
      if (status !== 'running') return

      const { data } = await supabase.from('scans').select('status, current_action').eq('id', scanId).single()
      
      if (data) {
        if (data.current_action !== action) setAction(data.current_action)
        
        // JIKA STATUS BERUBAH JADI SELESAI
        if (data.status !== 'running') {
           setStatus(data.status)
           
           // Munculkan notifikasi ke user!
           if (data.status === 'completed') {
             toast.success("Pemindaian AI Selesai!", {
               description: "Memuat hasil laporan keamanan Anda...",
               duration: 4000
             })
           } else {
             toast.error("Pemindaian Gagal", {
               description: "Terjadi kesalahan saat agen mengakses target."
             })
           }

           // Refresh halaman untuk memunculkan daftar bug atau kotak aman
           router.refresh() 
        }
      }
    }, 2000)

    return () => { clearInterval(dotInterval); clearInterval(fetchInterval) }
  }, [scanId, status, action, router, supabase])

  // Kalau sudah selesai, terminalnya kita sulap jadi warna hijau (bukan hilang tiba-tiba)
  if (status === 'completed') {
    return (
      <div className="w-full bg-emerald-950/50 rounded-xl border border-emerald-900 p-6 my-6 font-mono animate-in fade-in zoom-in duration-500">
        <div className="flex items-center gap-3 text-emerald-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-bold tracking-widest uppercase">Agent Execution Finished</span>
        </div>
      </div>
    )
  }

  if (status !== 'running') return null 

  return (
    <div className="w-full bg-black rounded-xl border border-zinc-800 p-6 my-6 shadow-2xl font-mono relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50"></div>
      
      <div className="flex items-center gap-3 mb-4 text-zinc-500 border-b border-zinc-800 pb-4">
        <Terminal className="w-5 h-5 text-emerald-500" />
        <span className="text-xs tracking-widest uppercase">Agent Execution Log</span>
      </div>

      <div className="flex items-start gap-3 text-emerald-400 text-sm md:text-base leading-relaxed">
        <Loader2 className="w-5 h-5 animate-spin shrink-0 mt-0.5" />
        <p>
          <span className="text-zinc-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
          {action}{dots}
        </p>
      </div>
    </div>
  )
}