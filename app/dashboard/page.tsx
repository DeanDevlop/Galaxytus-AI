"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Activity, ShieldAlert, ShieldCheck, Bug, Terminal, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"

// Helper: Menghitung waktu berlalu (contoh: "10 mins ago")
function timeAgo(dateString: string) {
  if (!dateString) return "Unknown"
  const date = new Date(dateString)
  const now = new Date()
  const diffMins = Math.round((now.getTime() - date.getTime()) / 60000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} mins ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs} hours ago`
  return `${Math.floor(diffHrs / 24)} days ago`
}

export default function DashboardOverview() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  
  // State untuk menyimpan data dinamis
  const [stats, setStats] = useState({
    totalScans: 0,
    criticalVulns: 0,
    patchesApplied: 0,
    averageScore: "B"
  })
  const [severityData, setSeverityData] = useState<any[]>([])
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [scanHistoryData, setScanHistoryData] = useState<any[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)

      // 1. Ambil Data Scans (Limit 5 terbaru untuk tabel)
      const { data: scans } = await supabase
        .from('scans')
        .select(`id, status, score_grade, created_at, projects(name)`)
        .order('created_at', { ascending: false })

      // 2. Ambil Semua Vulnerabilities
      const { data: vulns } = await supabase
        .from('vulnerabilities')
        .select('id, severity, created_at')

      // 3. Ambil Semua Remediations (Patches)
      const { data: remediations } = await supabase
        .from('remediations')
        .select('id, status, created_at')

      if (scans && vulns && remediations) {
        // --- HITUNG KPI CARDS ---
        const totalScansCount = scans.length
        const criticalCount = vulns.filter(v => v.severity === 'critical').length
        const appliedPatchesCount = remediations.filter(r => r.status === 'applied').length
        
        // Hitung rata-rata grade kasar (A=4, B=3, C=2, F=0)
        let totalScore = 0
        scans.forEach(s => {
          if (s.score_grade === 'A') totalScore += 4
          else if (s.score_grade === 'B') totalScore += 3
          else if (s.score_grade === 'C') totalScore += 2
        })
        const avg = totalScansCount > 0 ? totalScore / totalScansCount : 0
        const avgGrade = avg > 3.5 ? 'A' : avg > 2.5 ? 'B' : avg > 1.5 ? 'C' : 'F'

        setStats({
          totalScans: totalScansCount,
          criticalVulns: criticalCount,
          patchesApplied: appliedPatchesCount,
          averageScore: avgGrade
        })

        // --- HITUNG PIE CHART (Severity) ---
        let c = 0, h = 0, m = 0, l = 0, info = 0
        vulns.forEach(v => {
          if (v.severity === 'critical') c++
          else if (v.severity === 'high') h++
          else if (v.severity === 'medium') m++
          else if (v.severity === 'low') l++
          else info++
        })
        
        // Hanya masukkan ke chart jika ada nilainya
        const newSeverityData = []
        if (c > 0) newSeverityData.push({ name: "Critical", value: c, color: "#ef4444" })
        if (h > 0) newSeverityData.push({ name: "High", value: h, color: "#f97316" })
        if (m > 0) newSeverityData.push({ name: "Medium", value: m, color: "#eab308" })
        if (l > 0) newSeverityData.push({ name: "Low", value: l, color: "#3b82f6" })
        if (info > 0) newSeverityData.push({ name: "Info", value: info, color: "#94a3b8" })
        setSeverityData(newSeverityData.length > 0 ? newSeverityData : [{ name: "Safe", value: 1, color: "#10b981" }])

        // --- SIAPKAN TABEL RECENT SCANS ---
        const mappedScans = scans.slice(0, 5).map(s => ({
          id: s.id.split('-')[0].toUpperCase(),
          originalId: s.id,
          project: s.projects?.name || "Unknown Target",
          status: s.status,
          score: s.score_grade || "-",
          time: timeAgo(s.created_at),
        }))
        setRecentScans(mappedScans)

        // --- MOCK UP TREND AREA CHART (Simplifikasi untuk demo) ---
        // Di dunia nyata ini digrouping per tanggal, di sini kita buat dinamis tapi simpel
        setScanHistoryData([
          { name: "Mon", critical: Math.floor(c * 0.2), resolved: Math.floor(appliedPatchesCount * 0.1) },
          { name: "Tue", critical: Math.floor(c * 0.4), resolved: Math.floor(appliedPatchesCount * 0.3) },
          { name: "Wed", critical: Math.floor(c * 0.1), resolved: Math.floor(appliedPatchesCount * 0.2) },
          { name: "Thu", critical: Math.floor(c * 0.6), resolved: Math.floor(appliedPatchesCount * 0.5) },
          { name: "Fri", critical: Math.floor(c * 0.8), resolved: Math.floor(appliedPatchesCount * 0.7) },
          { name: "Sat", critical: Math.floor(c * 0.3), resolved: Math.floor(appliedPatchesCount * 0.9) },
          { name: "Sun", critical: c, resolved: appliedPatchesCount },
        ])
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [supabase])

  if (loading) {
    return <div className="flex items-center justify-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
  }

  const totalActiveVulns = severityData.reduce((acc, curr) => curr.name !== "Safe" ? acc + curr.value : 0, 0)

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Posture</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Ringkasan ancaman keamanan pada seluruh workspace Anda.</p>
        </div>
      </div>

      {/* KPI CARDS (Grid 4 Kolom) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans (All Time)</CardTitle>
            <Activity className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-zinc-500 flex items-center mt-1">
              Data ditarik secara real-time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Vulnerabilities</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.criticalVulns}</div>
            <p className="text-xs text-red-500 flex items-center mt-1">
              {stats.criticalVulns > 0 ? <><ArrowUpRight className="mr-1 h-3 w-3" /> Membutuhkan perhatian segera</> : "Sistem Anda aman dari ancaman kritis."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Auto-Patches Applied</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.patchesApplied}</div>
            <p className="text-xs text-zinc-500 flex items-center mt-1">
              Berhasil direparasi oleh AI Agent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Security Score</CardTitle>
            <Terminal className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.averageScore === 'F' ? 'text-red-500' : 'text-emerald-500'}`}>
              {stats.averageScore}
            </div>
            <Progress value={stats.averageScore === 'A' ? 95 : stats.averageScore === 'B' ? 75 : stats.averageScore === 'C' ? 50 : 20} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION (Grid 2 Kolom Asimetris) */}
      <div className="grid gap-4 md:grid-cols-7">
        
        {/* AREA CHART: Trend Kerentanan */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Vulnerability Trend</CardTitle>
            <CardDescription>Rasio ancaman terdeteksi vs berhasil di-patch oleh AI (7 Hari Terakhir).</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scanHistoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="critical" name="Threats Found" stroke="#ef4444" fillOpacity={1} fill="url(#colorCritical)" strokeWidth={2} />
                  <Area type="monotone" dataKey="resolved" name="Patches Applied" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* DONUT CHART: Distribusi Keparahan */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Pemetaan tingkat ancaman aktif saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[300px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Teks di tengah Donut Chart */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <Bug className={`h-6 w-6 mb-1 ${totalActiveVulns === 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                <span className="text-3xl font-bold">{totalActiveVulns}</span>
                <span className="text-xs text-zinc-500">Bugs Found</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE SECTION: Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Agent Executions</CardTitle>
          <CardDescription>Aktivitas pemindaian agen AI terbaru di workspace Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scan ID</TableHead>
                <TableHead>Target Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Executed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentScans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-zinc-500">Belum ada pemindaian AI yang dijalankan.</TableCell>
                </TableRow>
              ) : recentScans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-mono text-xs">{scan.id}</TableCell>
                  <TableCell className="font-medium">{scan.project}</TableCell>
                  <TableCell>
                    <Badge variant={scan.status === 'completed' ? 'default' : scan.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize">
                      {scan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${scan.score === 'A' || scan.score === 'B' ? 'text-emerald-500' : scan.score === 'F' ? 'text-red-500' : 'text-zinc-500'}`}>
                      {scan.score}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-zinc-500 text-sm">{scan.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
  )
}