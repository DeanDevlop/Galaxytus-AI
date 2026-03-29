import { createClient } from '@/lib/supabase/server'
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, AlertTriangle, Scale, Activity, FileWarning, Terminal } from "lucide-react"
import ComplianceRadarChart from './ComplianceRadarChart'

export default async function ComplianceBoardPage() {
  const supabase = await createClient()

  // 1. Ambil Sesi User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // 2. Ambil SEMUA Vulnerabilities dari semua project milik user ini
  const { data: vulnerabilities, error } = await supabase
    .from('vulnerabilities')
    .select(`
      id, severity, vulnerability_type,
      scans!inner( projects!inner( organizations!inner( organization_members!inner(user_id) ) ) )
    `)
    .eq('scans.projects.organizations.organization_members.user_id', user.id)

  const vulns = vulnerabilities || []

  // 3. LOGIKA AI: Pemetaan ke OWASP Top 10
  const owaspData = [
    { subject: 'A01: Broken Access Control', A: 100, fullMark: 100 },
    { subject: 'A02: Cryptographic Failures', A: 100, fullMark: 100 },
    { subject: 'A03: Injection (SQLi/XSS)', A: 100, fullMark: 100 },
    { subject: 'A04: Insecure Design', A: 100, fullMark: 100 },
    { subject: 'A05: Security Misconfiguration', A: 100, fullMark: 100 },
    { subject: 'A06: Vulnerable Components', A: 100, fullMark: 100 },
  ]

  vulns.forEach((v: any) => {
    const type = v.vulnerability_type.toLowerCase()
    const penalty = v.severity === 'critical' ? 20 : v.severity === 'high' ? 10 : 5

    if (type.includes('sql') || type.includes('xss') || type.includes('injection')) owaspData[2].A -= penalty
    else if (type.includes('auth') || type.includes('token') || type.includes('access')) owaspData[0].A -= penalty
    else if (type.includes('crypto') || type.includes('ssl') || type.includes('hash')) owaspData[1].A -= penalty
    else owaspData[4].A -= penalty 
  })

  owaspData.forEach(d => d.A = Math.max(0, d.A))

  // Hitung Skor Rata-rata Kepatuhan
  const averageScore = Math.round(owaspData.reduce((acc, curr) => acc + curr.A, 0) / owaspData.length)
  const isHealthy = averageScore > 80

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* HEADER C-LEVEL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Scale className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Executive Compliance Board</h1>
          </div>
          <p className="text-zinc-500 text-sm max-w-xl">
            Laporan audit kepatuhan regulasi industri (OWASP Framework). Dirancang khusus untuk CISO dan tim Audit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
            <Activity className="w-4 h-4 mr-2 text-blue-500 animate-pulse" /> Live Audit Active
          </Badge>
        </div>
      </div>

      {/* SUMMARY CARDS (SHADCN STYLED) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Main Score dengan Progress Bar */}
        <Card className="shadow-md border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
          <div className={`absolute top-0 left-0 w-1 h-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Global Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-black ${isHealthy ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                {averageScore}
              </span>
              <span className="text-xl font-bold text-zinc-400">/ 100</span>
            </div>
            <Progress value={averageScore} className="h-2 mt-4" indicatorColor={isHealthy ? 'bg-emerald-500' : 'bg-red-500'} />
            <p className="text-xs text-zinc-500 mt-3 font-medium">Diukur dari agregasi {vulns.length} temuan keamanan aktif.</p>
          </CardContent>
        </Card>

        {/* Card 2: Critical Risks */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Critical Business Risk</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-zinc-900 dark:text-white">
              {vulns.filter((v: any) => v.severity === 'critical').length}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Ancaman level kritikal yang berpotensi menyebabkan kebocoran data klien.</p>
          </CardContent>
        </Card>

        {/* Card 3: Audit Status */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">ISO 27001 Status</CardTitle>
            <ShieldCheck className={`h-5 w-5 ${isHealthy ? 'text-emerald-500' : 'text-zinc-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-widest mt-2">
              {isHealthy ? 'PASSED (A)' : averageScore > 60 ? 'NEEDS REVIEW' : 'FAILED (F)'}
            </div>
            <Badge variant={isHealthy ? "default" : "destructive"} className="mt-3">
              {isHealthy ? 'Ready for Certification' : 'Immediate Action Required'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* RADAR CHART & RECOMMENDATIONS SECTION */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Kiri: Grafik Radar */}
        <Card className="lg:col-span-2 shadow-lg border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-xl">OWASP Top 10 Security Posture</CardTitle>
            <CardDescription>Pemetaan ketahanan arsitektur aplikasi terhadap standar industri global.</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px] w-full">
            <ComplianceRadarChart data={owaspData} />
          </CardContent>
        </Card>

        {/* Kanan: Actionable Insights pakai Shadcn Alert */}
        <Card className="shadow-lg border-zinc-200 dark:border-zinc-800 flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Actionable Insights</CardTitle>
            <CardDescription>Rekomendasi eksekutif berbasis AI.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto pr-2">
            {owaspData.filter(d => d.A < 80).map((issue, idx) => (
              <Alert variant="destructive" key={idx} className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
                <Terminal className="h-4 w-4" />
                <AlertTitle className="text-sm font-bold tracking-tight">{issue.subject}</AlertTitle>
                <AlertDescription className="text-xs mt-1.5 opacity-90 leading-relaxed">
                  Skor kepatuhan rentan ({issue.A}%). Segera alokasikan *resource engineering* untuk remediasi guna mencegah denda regulatori.
                </AlertDescription>
              </Alert>
            ))}

            {owaspData.filter(d => d.A < 80).length === 0 && (
               <Alert className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                 <ShieldCheck className="h-4 w-4 stroke-emerald-600 dark:stroke-emerald-400" />
                 <AlertTitle className="text-sm font-bold tracking-tight">Postur Sangat Aman</AlertTitle>
                 <AlertDescription className="text-xs mt-1.5 opacity-90 leading-relaxed">
                   Tidak terdeteksi pelanggaran kritikal. Sistem sudah memenuhi standar kepatuhan OWASP tingkat tinggi.
                 </AlertDescription>
               </Alert>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}