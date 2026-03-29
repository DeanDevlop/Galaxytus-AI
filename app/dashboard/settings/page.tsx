import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { GitBranch , CreditCard, Settings2, AlertTriangle, Zap } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()

  // 1. Ambil data user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Ambil data Organisasi (PASTIKAN api_key IKUT DIAMBIL DARI DB)
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, api_key)')
    .eq('user_id', user.id)
    .single()
  
  // @ts-ignore
  const orgId = orgMember?.organization_id || orgMember?.organizations?.id
  // @ts-ignore
  const orgName = orgMember?.organizations?.name || "Personal Workspace"
  // @ts-ignore
  const apiKey = orgMember?.organizations?.api_key || ""

  // 3. HITUNG PENGGUNAAN KUOTA HARI INI
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString())

  const scansUsed = count || 0
  const maxScans = 3
  const usagePercentage = Math.min((scansUsed / maxScans) * 100, 100)

  // 4. FUNGSI GENERATE API KEY (Server Action)
  const generateNewKey = async () => {
    'use server'
    const supabaseAdmin = await createClient()
    
    // Bikin string acak ala Stripe/GitHub API Key
    const newKey = "glx_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Update ke database
    await supabaseAdmin
      .from('organizations')
      .update({ api_key: newKey })
      .eq('id', orgId)
      
    // Refresh UI otomatis
    revalidatePath('/dashboard/settings')
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-500">Kelola pengaturan workspace, limit penggunaan API, dan integrasi Anda.</p>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        {/* MENU TABS */}
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="usage"><CreditCard className="w-4 h-4 mr-2"/> Usage</TabsTrigger>
          <TabsTrigger value="integrations"><GitBranch  className="w-4 h-4 mr-2"/> Integrations</TabsTrigger>
          <TabsTrigger value="general"><Settings2 className="w-4 h-4 mr-2"/> General</TabsTrigger>
        </TabsList>

        {/* ========================================== */}
        {/* TAB 1: USAGE & BILLING (KUOTA) */}
        {/* ========================================== */}
        <TabsContent value="usage" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Plan & Usage
              </CardTitle>
              <CardDescription>
                Anda saat ini menggunakan paket <strong>Free Tier</strong> (Developer Preview).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">AI Daily Scans</span>
                  <span className="text-zinc-500">{scansUsed} / {maxScans} digunakan</span>
                </div>
                <Progress 
                  value={usagePercentage} 
                  className={`h-2 ${usagePercentage >= 100 ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 2: DEVELOPER API & INTEGRATIONS */}
        {/* ========================================== */}
        <TabsContent value="integrations" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" /> Developer API Key
              </CardTitle>
              <CardDescription>
                Gunakan API Key ini untuk mengintegrasikan Galaxytus AI ke dalam pipeline CI/CD Anda (seperti GitHub Actions atau GitLab CI).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* FORM GENERATE KEY */}
              <form action={generateNewKey}>
                <div className="space-y-2">
                  <Label htmlFor="api-key">Secret API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="api-key" 
                      type="text" 
                      value={apiKey || "Belum ada API Key. Silakan generate baru."} 
                      readOnly 
                      className={`font-mono ${apiKey ? 'text-emerald-600 font-bold dark:text-emerald-400' : 'text-zinc-500'}`}
                    />
                    <Button type="submit" variant="default" className="bg-zinc-900 text-white hover:bg-zinc-800 shrink-0">
                      {apiKey ? "Regenerate Key" : "Generate Key"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    Jaga kerahasiaan kunci ini. Jangan pernah mengunggahnya secara publik.
                  </p>
                </div>
              </form>

              {/* BUKTI OTOMATISASI (CHEAT SHEET UNTUK USER) */}
              {apiKey && (
                <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h4 className="font-bold text-sm mb-3">Contoh Integrasi cURL</h4>
                  <p className="text-xs text-zinc-500 mb-3">Jalankan perintah ini di Terminal untuk memicu AI secara *remote*.</p>
                  <div className="bg-black text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre border border-zinc-800">
{`curl -X POST http://localhost:3000/api/v1/scan \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"projectId": "MASUKKAN_ID_PROJECT_ANDA_DI_SINI"}'`}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 3: GENERAL & DANGER ZONE */}
        {/* ========================================== */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Nama Workspace</Label>
              <Input defaultValue={orgName} disabled className="mt-2" />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}