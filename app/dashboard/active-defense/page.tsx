'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert, Crosshair, Copy, CheckCircle2, Bot, ServerCog } from "lucide-react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Dummy Data: Template Honeypot yang akan di-generate AI
const HONEYPOT_TEMPLATES = {
  nextjs: `// app/api/admin-v2/route.ts (HONEYPOT ENDPOINT)
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'Unknown IP';
  const userAgent = request.headers.get('user-agent');
  
  // 1. Catat IP Penyerang ke Database Keamanan Anda
  console.error(\`🚨 [HONEYPOT TRIGGERED] Unauthorized access attempt from IP: \${ip}\`);
  console.error(\`User-Agent: \${userAgent}\`);
  
  // 2. (Opsional) Kirim Webhook ke Slack/Discord Tim SecOps Anda
  
  // 3. Berikan respons palsu untuk menipu bot scanner
  // Buat mereka mengira ini adalah panel admin sungguhan yang butuh otentikasi
  return NextResponse.json(
    { 
      error: "Invalid API Token", 
      message: "Please provide a valid x-admin-auth header to access this internal portal." 
    }, 
    { status: 401 }
  );
}`,
  express: `// honeypot.js (Express Middleware)
const express = require('express');
const router = express.Router();

// Jebakan untuk bot yang mencari file konfigurasi .env
router.get('/.env.backup', (req, res) => {
  const attackerIp = req.ip;
  console.warn(\`⚠️ [INTRUSION ATTEMPT] IP \${attackerIp} tried to access .env.backup\`);
  
  // Masukkan IP ke Blacklist (Redis/Database)
  // blockIpInFirewall(attackerIp);

  // Kirim data palsu yang menyesatkan (Tarpit)
  res.status(200).send('DB_HOST=127.0.0.1\\nDB_PASS=fake_password_123\\nAWS_KEY=AKIA_FAKE_KEY_DONT_USE');
});

module.exports = router;`,
}

export default function ActiveDefensePage() {
  const [framework, setFramework] = useState<keyof typeof HONEYPOT_TEMPLATES>('nextjs')
  const [isCopied, setIsCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [code, setCode] = useState(HONEYPOT_TEMPLATES['nextjs'])

  // Simulasi AI men-generate kode (Di dunia nyata, ini memanggil Gemini API)
  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setCode(HONEYPOT_TEMPLATES[framework])
      setIsGenerating(false)
      setIsCopied(false)
    }, 1500)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* HEADER TACTICAL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-900/50">
              <Crosshair className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Active Defense Center</h1>
          </div>
          <p className="text-zinc-500 text-sm max-w-xl">
            Bangun perangkap digital (Honeypot) untuk mendeteksi, mencatat, dan memblokir peretas sebelum mereka menyentuh data sensitif Anda.
          </p>
        </div>
        <Badge variant="destructive" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest animate-pulse w-fit">
          <ShieldAlert className="w-4 h-4 mr-2" /> Counter-Measure Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: KONFIGURATOR */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <CardTitle className="text-lg flex items-center gap-2">
                <ServerCog className="w-5 h-5 text-zinc-500" /> Deployment Settings
              </CardTitle>
              <CardDescription className="text-xs">Konfigurasi agen perangkap Anda.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Framework</Label>
                <Select value={framework} onValueChange={(val: any) => setFramework(val)}>
                  <SelectTrigger className="w-full h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Pilih Framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nextjs">Next.js (App Router)</SelectItem>
                    <SelectItem value="express">Node.js (Express)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipe Jebakan (Bait Type)</Label>
                <Select defaultValue="fake-admin">
                  <SelectTrigger className="w-full h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fake-admin">Fake Admin Panel (/api/admin)</SelectItem>
                    <SelectItem value="fake-env">Exposed Config (.env.backup)</SelectItem>
                    <SelectItem value="fake-db">Dummy Database Port</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full h-11 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold mt-4"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> Generating Payload...</span>
                ) : (
                  <span className="flex items-center gap-2"><Bot className="w-4 h-4" /> Synthesize Honeypot</span>
                )}
              </Button>

            </CardContent>
          </Card>

          <Alert className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <AlertTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" /> Cara Kerja Tarpit
            </AlertTitle>
            <AlertDescription className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Kode ini sengaja dirancang rapuh untuk memancing bot. Jangan pernah meletakkan data asli di dalam direktori Honeypot ini.
            </AlertDescription>
          </Alert>
        </div>

        {/* KOLOM KANAN: HASIL KODE */}
        <div className="lg:col-span-8">
          <Card className="border-red-100 dark:border-red-900/30 shadow-lg bg-[#0d0d0d] overflow-hidden flex flex-col h-full min-h-[500px]">
            <CardHeader className="border-b border-zinc-800/50 bg-[#141414] py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                </div>
                <CardTitle className="text-xs font-mono font-medium text-zinc-400">
                  {framework === 'nextjs' ? 'app/api/admin-v2/route.ts' : 'middleware/honeypot.js'}
                </CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy}
                className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                {isCopied ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {isCopied ? 'Copied to Clipboard' : 'Copy Code'}
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center space-y-4">
                    <Crosshair className="w-12 h-12 text-red-500 animate-spin mx-auto opacity-80" />
                    <p className="text-red-500 font-mono text-sm tracking-widest uppercase animate-pulse">Compiling Trap...</p>
                  </div>
                </div>
              )}
              <SyntaxHighlighter 
                language="typescript" 
                style={vscDarkPlus} 
                customStyle={{ 
                  margin: 0, 
                  padding: '1.5rem', 
                  fontSize: '13px', 
                  background: 'transparent',
                  height: '100%',
                  fontFamily: 'var(--font-mono)'
                }}
                showLineNumbers
              >
                {code}
              </SyntaxHighlighter>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}