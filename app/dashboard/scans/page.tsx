import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Activity, ShieldCheck, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ScansPage() {
  const supabase = await createClient()

  // 1. Ambil sesi user saat ini
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Cari tahu user ini berada di Workspace (Organisasi) mana
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const orgId = orgMember?.organization_id

  // 3. Query Relasional Tingkat Tinggi: Ambil Scan + Nama Proyek + Jumlah Kerentanan
  const { data: scans, error } = await supabase
    .from('scans')
    .select(`
      id, 
      status, 
      score_grade, 
      created_at,
      completed_at,
      projects!inner(name, target_url, organization_id),
      vulnerabilities(id, severity)
    `)
    .eq('projects.organization_id', orgId)
    .order('created_at', { ascending: false })

  // Fungsi helper untuk mewarnai status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>
      case 'running': return <Badge variant="secondary" className="animate-pulse border-blue-500 text-blue-500">Running AI...</Badge>
      case 'failed': return <Badge variant="destructive">Failed</Badge>
      default: return <Badge variant="outline" className="text-zinc-500">Queued</Badge>
    }
  }

  // Fungsi helper untuk mewarnai nilai/grade
  const getGradeColor = (grade: string) => {
    if (!grade) return "text-zinc-400"
    if (grade.includes('A') || grade.includes('B')) return "text-emerald-500 font-bold"
    if (grade.includes('C') || grade.includes('D')) return "text-yellow-500 font-bold"
    return "text-red-500 font-bold"
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
          <p className="text-zinc-500">Pantau status dan hasil pemindaian agen AI pada target Anda.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Eksekusi Agen</CardTitle>
          <CardDescription>Menampilkan semua aktivitas pemindaian di workspace ini.</CardDescription>
        </CardHeader>
        <CardContent>
          {(!scans || scans.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                <Activity className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold">Belum ada aktivitas scan</h3>
              <p className="text-zinc-500 max-w-sm mt-2 mb-6">
                Anda belum pernah memicu agen AI untuk melakukan pemindaian. Mulai scan pertama Anda dari halaman Projects.
              </p>
              <Link href="/dashboard/projects">
                <Button>Ke Halaman Projects</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scan ID</TableHead>
                  <TableHead>Target Proyek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Bug Ditemukan</TableHead>
                  <TableHead>Waktu Mulai</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan: any) => {
                  // Menghitung jumlah kerentanan dari relasi tabel
                  const bugCount = scan.vulnerabilities?.length || 0;
                  const criticalCount = scan.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0;

                  return (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium text-xs text-zinc-500">
                        {scan.id.split('-')[0].toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{scan.projects.name}</div>
                        <div className="text-xs text-zinc-500">{scan.projects.target_url}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(scan.status)}
                      </TableCell>
                      <TableCell className={getGradeColor(scan.score_grade)}>
                        {scan.score_grade || '-'}
                      </TableCell>
                      <TableCell>
                        {bugCount > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-500">{bugCount}</span>
                            {criticalCount > 0 && (
                              <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 dark:bg-red-950/50">
                                {criticalCount} Critical
                              </Badge>
                            )}
                          </div>
                        ) : scan.status === 'completed' ? (
                          <span className="flex items-center text-emerald-500 text-sm">
                            <ShieldCheck className="w-4 h-4 mr-1" /> Aman
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/scans/${scan.id}`}>
                          <Button variant="ghost" size="sm" disabled={scan.status !== 'completed'}>
                            Lihat Detail
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}