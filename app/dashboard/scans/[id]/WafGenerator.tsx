'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Server, Cloud, Zap, Loader2 } from "lucide-react"

// Import Syntax Highlighter
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function WafGenerator({ vulnContext }: { vulnContext: any }) {
  const [wafRules, setWafRules] = useState<{ nginx: string, cloudflare: string, explanation: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generateWAF = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/waf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vulnContext)
      })
      const data = await res.json()
      if (data.nginx) setWafRules(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!wafRules && !isLoading) {
    return (
      <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center text-center">
        <ShieldAlert className="w-10 h-10 text-zinc-400 mb-4" />
        <h4 className="font-bold text-lg mb-2">Darurat? Terapkan Virtual Patching</h4>
        <p className="text-sm text-zinc-500 mb-6 max-w-md">
          Buat aturan Firewall (WAF) otomatis untuk memblokir eksploitasi pada jalur jaringan sebelum patch kode dirilis ke produksi.
        </p>
        <Button onClick={generateWAF} className="bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-full">
          <Zap className="w-4 h-4 mr-2" /> Generate WAF Rules
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mt-6 border border-zinc-200 dark:border-zinc-800 rounded-xl p-10 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500 animate-pulse">Menghubungi Galaxytus NetSec AI...</p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-2">
          <ShieldAlert className="w-5 h-5" /> Active Virtual Patch Ready
        </div>
        <p className="text-sm text-emerald-600 dark:text-emerald-500">{wafRules?.explanation}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NGINX RULE */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-[#1E1E1E]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <span className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
              <Server className="w-4 h-4 text-blue-400" /> Nginx Config
            </span>
          </div>
          <div className="p-0">
            <SyntaxHighlighter language="nginx" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: '12px', background: 'transparent' }}>
              {wafRules?.nginx || "# Gagal memuat"}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* CLOUDFLARE RULE */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-[#1E1E1E]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <span className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
              <Cloud className="w-4 h-4 text-orange-400" /> Cloudflare Expression
            </span>
          </div>
          <div className="p-0">
            <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: '12px', background: 'transparent' }}>
              {wafRules?.cloudflare || "// Gagal memuat"}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  )
}