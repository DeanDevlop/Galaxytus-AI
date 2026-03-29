import { createClient } from '@/lib/supabase/server'
import { notFound } from "next/navigation"
import Image from "next/image"
import PrintButton from "./PrintButton"

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: scan, error } = await supabase
    .from('scans')
    .select(`
      id, status, score_grade, created_at, completed_at,
      projects!inner(name, target_url, source_type, organizations!inner(organization_members!inner(user_id))),
      vulnerabilities(id, severity, vulnerability_type, description, file_path)
    `)
    .eq('id', id)
    .eq('projects.organizations.organization_members.user_id', user.id)
    .single()

  if (!scan || error) return notFound()

  const vulnerabilities = scan.vulnerabilities || []
  const critical = vulnerabilities.filter((v: any) => v.severity === 'critical').length
  const high = vulnerabilities.filter((v: any) => v.severity === 'high').length
  const medium = vulnerabilities.filter((v: any) => v.severity === 'medium').length
  const low = vulnerabilities.filter((v: any) => v.severity === 'low').length

  return (
    <div className="bg-white text-black min-h-screen p-8 md:p-16 font-sans max-w-4xl mx-auto">
      {/* Script Auto-Print: Otomatis buka dialog PDF saat halaman dimuat */}
      <script dangerouslySetInnerHTML={{ __html: 'window.onload = function() { window.print(); }' }} />

      {/* HEADER LAPORAN */}
      <div className="flex justify-between items-end border-b-2 border-zinc-800 pb-6 mb-8">
        <div>
          
          <h1 className="text-3xl font-bold tracking-tight uppercase">Security Audit Report</h1>
          <p className="text-zinc-500 font-mono text-sm mt-1">ID: {scan.id}</p>
        </div>
        <div className="text-right text-sm text-zinc-600">
          <p className="font-bold text-black">CONFIDENTIAL</p>
          <p>Generated: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Engine: Gemini 2.5 Flash SAST/DAST</p>
        </div>
      </div>

      {/* METADATA TARGET */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Target Information</h3>
          <p className="font-semibold text-lg">{scan.projects.name}</p>
          <p className="text-zinc-600 font-mono text-sm break-all">{scan.projects.target_url}</p>
          <p className="text-zinc-500 text-sm mt-2 capitalize">Type: {scan.projects.source_type.replace('_', ' ')}</p>
        </div>
        <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 flex flex-col justify-center items-center">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Security Grade</h3>
          <div className="text-6xl font-extrabold text-black">{scan.score_grade || 'A'}</div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="mb-10">
        <h2 className="text-xl font-bold border-b border-zinc-200 pb-2 mb-4">Executive Summary</h2>
        <p className="text-sm leading-relaxed text-zinc-700 mb-6">
          Pemindaian ini dilakukan oleh agen otonom Galaxytus AI. Ditemukan total <strong>{vulnerabilities.length}</strong> kerentanan keamanan pada target. 
          Rincian tingkat keparahan: <strong>{critical} Critical</strong>, <strong>{high} High</strong>, <strong>{medium} Medium</strong>, dan <strong>{low} Low</strong>.
        </p>
        
        {/* TABEL STATISTIK */}
        <div className="flex gap-4">
          {[
            { label: 'CRITICAL', count: critical, color: 'bg-red-100 text-red-800 border-red-200' },
            { label: 'HIGH', count: high, color: 'bg-orange-100 text-orange-800 border-orange-200' },
            { label: 'MEDIUM', count: medium, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            { label: 'LOW / INFO', count: low, color: 'bg-blue-100 text-blue-800 border-blue-200' }
          ].map((stat, i) => (
            <div key={i} className={`flex-1 p-3 rounded border text-center ${stat.color}`}>
              <div className="text-2xl font-bold">{stat.count}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED FINDINGS */}
      <div className="mb-10 break-inside-auto">
        <h2 className="text-xl font-bold border-b border-zinc-200 pb-2 mb-4">Detailed Vulnerabilities</h2>
        {vulnerabilities.length === 0 ? (
          <p className="text-zinc-500 text-center py-10 border border-dashed rounded-lg">Tidak ada kerentanan yang ditemukan. Sistem aman.</p>
        ) : (
          <div className="space-y-6">
            {vulnerabilities.map((vuln: any, idx: number) => (
              <div key={idx} className="border border-zinc-200 rounded-lg p-5 break-inside-avoid">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{vuln.vulnerability_type}</h3>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-zinc-100 uppercase border border-zinc-200">
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 mb-4">{vuln.description}</p>
                <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Target Endpoint: </span>
                  <code className="text-xs text-zinc-800 break-all">{vuln.file_path}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER PDF */}
      <div className="text-center pt-10 mt-10 border-t border-zinc-200 text-xs text-zinc-400 print:fixed print:bottom-10 print:w-full">
        <p>Laporan ini dihasilkan secara otomatis oleh Galaxytus AI Agentic Security.</p>
        <p>Hak Cipta &copy; {new Date().getFullYear()} Galaxytus. Dokumen bersifat Rahasia.</p>
      </div>

      {/* Tombol manual jika popup print di-block browser */}
   <PrintButton />
    </div>
  )
}