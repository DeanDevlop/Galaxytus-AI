import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { inngest } from "@/inngest/client"

// Gunakan Service Role Key karena ini Public API (Bypass RLS dengan aman)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper: Cek apakah string adalah UUID yang valid
const isValidUUID = (id: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function POST(req: Request) {
  try {
    // 1. Validasi Header & Extract Token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid Bearer token." }, { status: 401 })
    }
    const apiKey = authHeader.split(" ")[1]

    // 2. Safely Parse JSON Body (Mencegah Error 500 jika payload cacat)
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: "Bad Request: Malformed JSON payload." }, { status: 400 })
    }

    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: "Bad Request: 'projectId' is strictly required." }, { status: 400 })
    }

    // 3. Validasi Tipe Data UUID (Mencegah Postgres Syntax Error)
    if (!isValidUUID(projectId)) {
      return NextResponse.json({ error: "Bad Request: 'projectId' must be a valid UUID." }, { status: 400 })
    }

    // 4. Autentikasi API Key ke Organisasi
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: "Forbidden: Invalid API Key credentials." }, { status: 403 })
    }

    // 5. Validasi Otorisasi Proyek
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, target_url, source_type')
      .eq('id', projectId)
      .eq('organization_id', org.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Not Found: Project does not exist or access denied." }, { status: 404 })
    }

    // 6. Rate Limiting (Anti-Spam)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const { count } = await supabaseAdmin
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .gte('created_at', startOfDay.toISOString())

    if (count !== null && count >= 3) {
      return NextResponse.json({ error: "Rate Limit Exceeded: Maximum daily scans (3/3) reached." }, { status: 429 })
    }

    // 7. Eksekusi: Buat Record & Bangunkan AI
    // Karena kita pakai supabaseAdmin, .select().single() di sini AMAN dari blokir RLS!
    const { data: scan, error: insertError } = await supabaseAdmin
      .from('scans')
      .insert({ project_id: project.id, status: 'pending' })
      .select()
      .single()

    if (insertError) throw insertError

    await inngest.send({
      name: "scan.start",
      data: { scanId: scan.id, targetUrl: project.target_url, sourceType: project.source_type }
    })

    return NextResponse.json({ 
      success: true, 
      message: "AI Security Scan protocol initiated successfully.",
      scanId: scan.id,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/scans/${scan.id}`
    }, { status: 200 })

  } catch (error: any) {
    // Log error internal ke server untuk debugging, tapi jangan bocorkan ke user/hacker
    console.error(" [FATAL API ERROR]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}