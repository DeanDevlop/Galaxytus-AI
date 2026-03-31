import { createClient } from '@/lib/supabase/server'
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Bug, FileCode, CheckCircle2, ShieldAlert, FileText, BotMessageSquare, Zap, ShieldCheck, GitBranch, Package, ExternalLink, GitCommitVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import LiveTerminal from "./LiveTerminal"
import CopilotChat from "./CopilotChat"
import WafGenerator from "./WafGenerator"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Ambil Sesi User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // 2. Query Dinamis
  const { data: scan, error } = await supabase
    .from('scans')
    .select(`
      id, status, current_action, score_grade, created_at, completed_at,
      projects!inner(name, target_url, source_type, organizations!inner(organization_members!inner(user_id))),
      vulnerabilities(
        id, severity, vulnerability_type, description, file_path, line_start, line_end,
        simulation, remediations(id, original_code, patched_code, status)
      )
    `)
    .eq('id', id)
    .eq('projects.organizations.organization_members.user_id', user.id)
    .single()

  if (!scan || error) {
    console.error("Error fetching scan detail:", error)
    return notFound()
  }

  // Helper statistik
  const vulnerabilities = scan.vulnerabilities || []
  const criticalCount = vulnerabilities.filter((v: any) => v.severity === 'critical').length
  const highCount = vulnerabilities.filter((v: any) => v.severity === 'high').length
  const totalPatches = vulnerabilities.filter((v: any) => v.remediations?.length > 0).length

  // Helper warna severity
  const getSeverityBadge = (severity: string, type?: string) => {
    // Tangani khusus untuk kebocoran rahasia
    if (type?.toLowerCase().includes('secret') || type?.toLowerCase().includes('credential')) {
       return <Badge className="bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 rounded-sm uppercase tracking-wider text-[10px] font-bold">SECRET LEAK</Badge>
    }

    switch (severity.toLowerCase()) {
      case 'critical': return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none rounded-sm uppercase tracking-wider text-[10px] font-bold">CRITICAL</Badge>
      case 'high': return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none rounded-sm uppercase tracking-wider text-[10px] font-bold">HIGH</Badge>
      case 'medium': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none rounded-sm uppercase tracking-wider text-[10px] font-bold">MEDIUM</Badge>
      case 'low': return <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-none rounded-sm uppercase tracking-wider text-[10px] font-bold">LOW</Badge>
      default: return <Badge variant="outline" className="rounded-sm uppercase tracking-wider text-[10px] font-bold">INFO</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/scans">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Scan Details</h1>
              <Badge variant="outline" className="text-xs font-mono">{scan.id.split('-')[0].toUpperCase()}</Badge>
            </div>
        <p className="text-zinc-500">Target: {scan.projects?.[0]?.target_url} ({scan.projects?.[0]?.name})</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-medium text-sm">
             {scan.status === 'completed' && (
              <Link href={`/dashboard/scans/${scan.id}/report`} target="_blank">
                <Button variant="outline" className="border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  <FileText className="w-4 h-4 mr-2" /> Export PDF
                </Button>
              </Link>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY DASHBOARD SECTION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Security Grade</CardTitle>
            <Zap className={`h-5 w-5 ${scan.score_grade === 'F' ? 'text-red-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-5xl font-extrabold ${scan.score_grade === 'F' ? 'text-red-500' : 'text-emerald-500'}`}>
              {scan.score_grade || (
                scan.status === 'running' ? (
                  <Loader2 className="h-12 w-12 animate-spin text-zinc-400 mx-auto" />
                ) : (
                  'P'
                )
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1 capitalize">Status: {scan.status}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugs Detected</CardTitle>
            <Bug className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold text-red-500">{vulnerabilities.length}</div>
            <p className="text-xs text-red-600 mt-1 font-medium">{criticalCount} Critical, {highCount} High Threats</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Type</CardTitle>
            <FileCode className="h-5 w-5 text-zinc-500" />
          </CardHeader>
          <CardContent>
           <div className="text-2xl font-bold capitalize">{scan.projects?.[0]?.source_type?.replace('_', ' ') || 'Unknown'}</div>
            <p className="text-xs text-zinc-500 mt-1">Metode: Agentic AI DAST/SAST Hybrid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Remediations</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold text-emerald-500">{totalPatches}</div>
            <p className="text-xs text-zinc-500 mt-1">Koreksi kode siap diterapkan oleh AI Agen.</p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================= */}
      {/* TERMINAL AKTIF JIKA SEDANG BERJALAN */}
      {/* ========================================= */}
      {scan.status === 'running' && (
         <LiveTerminal scanId={scan.id} initialStatus={scan.status} initialAction={scan.current_action} />
      )}

      {/* ========================================= */}
      {/* AREA TABS: DAFTAR BUG & SBOM (JIKA SUDAH SELESAI) */}
      {/* ========================================= */}
      {scan.status === 'completed' && (
        <Tabs defaultValue="vulnerabilities" className="w-full mt-2">
          
          <TabsList className="mb-4 bg-transparent border-b border-zinc-200 dark:border-zinc-800 rounded-none w-full justify-start h-auto p-0 space-x-6">
            <TabsTrigger 
              value="vulnerabilities" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold"
            >
              <Bug className="w-4 h-4 mr-2" /> Temuan Ancaman ({vulnerabilities.length})
            </TabsTrigger>
            {/* TAMBAHAN TAB SBOM */}
            <TabsTrigger 
              value="sbom" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-semibold"
            >
              <Package className="w-4 h-4 mr-2" /> Software Bill of Materials (SBOM)
            </TabsTrigger>
          </TabsList>

          {/* TAB CONTENT: DAFTAR BUG (KODE ASLI MU) */}
          <TabsContent value="vulnerabilities" className="m-0 focus-visible:outline-none">
            {vulnerabilities.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Temuan Ancaman Keamanan Dinamis (Live dari Galaxytus)</CardTitle>
                  <CardDescription>Analisis teknis detail dan usulan perbaikan otomatis dari agen AI.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={`vuln-${vulnerabilities[0]?.id}`} className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Sidebar Daftar Bug (Kiri) */}
                      <div className="md:col-span-4 lg:col-span-3 border-r border-zinc-200 dark:border-zinc-800 pr-4">
                        <TabsList className="flex flex-col h-auto w-full bg-transparent p-2 space-y-1 items-stretch justify-start rounded-none">
                          {vulnerabilities.map((vuln: any) => (
                            <TabsTrigger 
                              key={vuln.id} 
                              value={`vuln-${vuln.id}`}
                              className="justify-start text-left px-3 py-4 h-auto whitespace-normal data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-700 rounded-lg transition-all"
                            >
                              <div className="flex items-start gap-3 w-full">
                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${vuln.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-50 text-sm leading-tight mb-1">
                                    {vuln.vulnerability_type}
                                  </span>
                                  <span className="text-[11px] text-zinc-500 truncate mb-2 uppercase tracking-wider font-medium">
                                     {vuln.severity} threat
                                  </span>
                                </div>
                              </div>
                            </TabsTrigger>
                            
                          ))}
                        </TabsList>
                      </div>

                    {/* Panel Detail Konten Bug (Kanan) */}
                      <div className="md:col-span-8 lg:col-span-9 mt-0">
                        {vulnerabilities.map((vuln: any) => {
                          const remediation = vuln.remediations?.[0];
                          return (
                            <TabsContent key={vuln.id} value={`vuln-${vuln.id}`} className="m-0 p-6 focus-visible:outline-none animate-in fade-in duration-300">
                              
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* KOLOM KIRI: INFO BUG & REMEDIATION */}
                                <div className="space-y-8 min-w-0">
                                  <WafGenerator 
                                  vulnContext={{
                                    vulnType: vuln.vulnerability_type,
                                    description: vuln.description,
                                    filePath: vuln.file_path || scan.projects?.[0]?.target_url || "Unknown Path"
                                  }} 
                                />
                                  {vuln.simulation && vuln.simulation.attacker_log && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                      <div className="flex items-center gap-2 text-zinc-500">
                                        <Zap className="w-5 h-5" />
                                        <h3 className="text-lg font-bold">Autonomous Red Teaming Simulation</h3>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 gap-4">
                                        {/* THE ATTACKER (RED AGENT) */}
                                        <div className="rounded-xl border border-red-900/50 bg-[#1a0f0f] p-5 shadow-inner relative overflow-hidden">
                                          <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-red-900/50 p-1.5 rounded-md">
                                              <Bug className="w-4 h-4 text-red-500" />
                                            </div>
                                            <span className="font-mono text-sm font-bold text-red-500 tracking-wider">RED AGENT (ATTACKER)</span>
                                          </div>
                                          <p className="text-red-200/80 text-sm leading-relaxed font-mono">
                                            {vuln.simulation.attacker_log}
                                          </p>
                                        </div>

                                        {/* THE DEFENDER (BLUE AGENT) */}
                                        <div className="rounded-xl border border-emerald-900/50 bg-[#0f1a14] p-5 shadow-inner relative overflow-hidden">
                                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
                                          <div className="flex items-center gap-2 mb-3">
                                            <div className="bg-emerald-900/50 p-1.5 rounded-md">
                                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <span className="font-mono text-sm font-bold text-emerald-500 tracking-wider">BLUE AGENT (DEFENDER)</span>
                                          </div>
                                          <p className="text-emerald-200/80 text-sm leading-relaxed font-mono">
                                            {vuln.simulation.defender_log}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                      <FileText className="w-5 h-5" />
                                      <h3 className="text-lg font-bold">Technical Analysis</h3>
                                    </div>
                                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900 shadow-sm">
                                      <div className="flex items-center gap-3 mb-4">
                                        {getSeverityBadge(vuln.severity, vuln.vulnerability_type)}
                                        <span className="font-mono text-xs text-zinc-400">ID: {vuln.id.split('-')[0]}</span>
                                      </div>
                                      <h4 className="text-xl font-bold mb-3">{vuln.vulnerability_type}</h4>
                                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm italic border-l-4 border-zinc-200 pl-4 py-1">
                                        "{vuln.description}"
                                      </p>
                                      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Target Endpoint / File</p>
                                        <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300 break-all">
                                          {vuln.file_path || scan.projects.target_url}
                                        </code>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 2. Remediation */}
                                  {remediation && (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2 text-emerald-600">
                                        <BotMessageSquare className="w-5 h-5" />
                                        <h3 className="text-lg font-bold">AI Proposed Remediation</h3>
                                      </div>
                                      
                                      <div className="border border-emerald-100 dark:border-emerald-900/50 rounded-xl overflow-hidden shadow-sm bg-emerald-50/30">
                                        <div className="p-0">
                                          <SyntaxHighlighter 
                                            language="typescript" 
                                            style={oneDark} 
                                            customStyle={{ margin: 0, padding: '20px', fontSize: '12px', background: '#18181b' }}
                                          >
                                            {remediation.patched_code}
                                          </SyntaxHighlighter>
                                        </div>

                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-t border-emerald-100 dark:border-emerald-900/50">
                                          {remediation.status === 'applied' ? (
                                            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                                              <CheckCircle2 className="w-5 h-5" /> 
                                              {scan.projects.source_type === 'github' ? "Pull Request Dibuat!" : "Patch Diterapkan!"}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-zinc-500">Kirim kode perbaikan ini ke target Anda.</p>
                                          )}

                                          {remediation.status !== 'applied' && (
                                            <form action={async (formData) => {
                                              'use server'
                                              if (scan.projects.source_type === 'github') {
                                                const { createGithubPR } = await import('../actions')
                                                await createGithubPR(formData)
                                              } else {
                                                const { applyRemediation } = await import('../actions')
                                                await applyRemediation(formData)
                                              }
                                            }}>
                                              <input type="hidden" name="remediationId" value={remediation.id} />
                                              <input type="hidden" name="scanId" value={scan.id} />
                                              <input type="hidden" name="targetUrl" value={scan.projects.target_url} />
                                              <input type="hidden" name="patchedCode" value={remediation.patched_code} />
                                              <input type="hidden" name="filePath" value={vuln.file_path} />
                                              
                                              <Button size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full xl:w-auto">
                                                {scan.projects.source_type === 'github' ? (
                                                  <><GitBranch className="w-4 h-4 mr-2" /> Auto Pull Request</>
                                                ) : (
                                                  "Terapkan Perbaikan"
                                                )}
                                              </Button>
                                            </form>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* KOLOM KANAN: AI SECURITY COPILOT */}
                                <div className="min-w-0">
                                  <CopilotChat 
                                    vulnContext={{
                                      type: vuln.vulnerability_type,
                                      file: vuln.file_path || scan.projects.target_url,
                                      desc: vuln.description,
                                      patch: remediation?.patched_code
                                    }} 
                                  />
                                </div>

                              </div>
                            </TabsContent>
                          );
                        })}
                      </div>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-12 text-center mt-2">
                 <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                 <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">Target Aman!</h3>
                 <p className="text-emerald-700 dark:text-emerald-600 max-w-md mx-auto">Galaxytus AI tidak menemukan kerentanan pada target ini. Kode Anda sudah dipoles dengan sangat baik.</p>
              </div>
            )}
          </TabsContent>

          {/* ====================================================== */}
          {/* TAB CONTENT BARU: SBOM (Software Bill of Materials) */}
          {/* ====================================================== */}
          <TabsContent value="sbom" className="m-0 focus-visible:outline-none animate-in fade-in duration-300">
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-2">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                      <Package className="w-5 h-5 text-zinc-500" />
                      Software Bill of Materials (SBOM)
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500 mt-1">
                      Inventaris pustaka pihak ketiga (Dependencies) dan status kerentanannya (CVE).
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-zinc-50 dark:bg-zinc-900">
                    Live Audit
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/20">
                    <TableRow className="border-zinc-100 dark:border-zinc-800">
                      <TableHead className="w-[300px] text-xs font-semibold uppercase tracking-wider text-zinc-500">Package Name</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Version</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">License</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Security Status</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* CONTOH DATA DUMMY SEMENTARA: PAKET RENTAN */}
                    <TableRow className="border-zinc-100 dark:border-zinc-800 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                      <TableCell className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <GitCommitVertical className="w-4 h-4 text-zinc-400" />
                        axios
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">0.21.1</TableCell>
                      <TableCell className="text-xs text-zinc-500">MIT</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 border-none text-[10px] uppercase font-bold rounded-sm">
                            CVE-2023-45857 (High)
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                          View Patch <ExternalLink className="w-3 h-3" />
                        </a>
                      </TableCell>
                    </TableRow>

                    {/* CONTOH DATA DUMMY SEMENTARA: PAKET AMAN */}
                    <TableRow className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <TableCell className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                         <GitCommitVertical className="w-4 h-4 text-zinc-400" />
                         react
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">18.2.0</TableCell>
                      <TableCell className="text-xs text-zinc-500">MIT</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 text-[10px] uppercase font-bold rounded-sm">
                            Secure
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-zinc-400">-</span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      )}

    </div>
  )
}
