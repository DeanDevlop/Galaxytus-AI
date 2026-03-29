import { inngest } from "@/inngest/client"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@supabase/supabase-js"

export const runAiPentest = inngest.createFunction(
  { 
    id: "agentic-ai-pentest", 
    // Master Standard: Retries ditambah agar lebih tangguh menghadapi rate limit API
    retries: 2, 
    triggers: [{ event: "scan.start" }] 
  },
  async ({ event, step }) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { scanId, targetUrl, sourceType } = event.data

    // 1. INIT STATUS DENGAN LOG PROFESIONAL
    await step.run("update-status-running", async () => {
      await supabaseAdmin.from('scans').update({ 
        status: 'running',
        current_action: ' Menginisialisasi Agen AI Keamanan (Engine: Gemini 2.5 Flash)...'
      }).eq('id', scanId)
    })

    // 2. ROBUST FETCH CODE (Dilengkapi Timeout & SSRF Protection Basic)
    await step.run("log-fetch", async () => {
      await supabaseAdmin.from('scans').update({ current_action: ` Mengambil dan memvalidasi source code dari: ${targetUrl}` }).eq('id', scanId)
    })
    
    const fetchResult = await step.run("fetch-target-code", async () => {
      try {
        const urlObj = new URL(targetUrl);
        // Master Standard: Proteksi dasar agar tidak scan localhost internal server
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
           throw new Error("Pengecualian Keamanan: Tidak dapat memindai alamat internal.");
        }

        // Master Standard: AbortController untuk mencegah fetching menggantung selamanya
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 detik maksimal

        const response = await fetch(targetUrl, { 
          headers: { 
            'User-Agent': 'Galaxytus-Security-Scanner/2.0 (Automated AI Pentest)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        
        const rawCode = await response.text();
        // Membatasi karakter agar tidak melewati batas token Gemini, tapi lebih presisi
        return { success: true, code: rawCode.substring(0, 80000), error: null }; 
      } catch (error: any) { 
        return { success: false, code: "", error: error.message || "Target tidak dapat dijangkau." }; 
      }
    })

    if (!fetchResult.success) {
      await step.run("mark-scan-failed", async () => {
        await supabaseAdmin.from('scans').update({ 
          status: 'failed', 
          current_action: ` Pemindaian dihentikan: ${fetchResult.error}`,
          completed_at: new Date().toISOString()
        }).eq('id', scanId)
      });
      return { status: "Halted", reason: fetchResult.error }; 
    }

    // 3. MASTER-LEVEL GEMINI SCAN DENGAN AI AUDITOR (REFLECTION LOOP)
    await step.run("log-gemini", async () => {
      await supabaseAdmin.from('scans').update({ current_action: 'Agen AI sedang melakukan Analisis SAST/DAST dan Audit QC (Quality Control)...' }).eq('id', scanId)
    })
    
    const aiAnalysis = await step.run("execute-gemini-scan", async () => {
      const systemPrompt = `Kamu adalah Senior Application Security Engineer, Auditor Keamanan Tersertifikasi, dan Sistem Multi-Agent Cyber Warfare.
Tugasmu adalah melakukan Static Application Security Testing (SAST) pada cuplikan kode atau struktur HTML berikut, lalu membagi dirimu menjadi dua entitas:
1. RED AGENT (Hacker): Menjelaskan cara mengeksploitasi celah tersebut dengan ganas.
2. BLUE AGENT (Defender): Menjelaskan cara kerja patch keamanan untuk menangkis Red Agent.

--- METADATA TARGET ---
URL Target: ${targetUrl}
Tipe Target: ${sourceType}

--- START SOURCE CODE ---
${fetchResult.code}
--- END SOURCE CODE ---

INSTRUKSI KETAT (MASTER LEVEL):
1. Fokus HANYA pada kerentanan keamanan nyata yang berisiko tinggi (OWASP Top 10, eksploitasi XSS, CSRF, Insecure Direct Object References, kredensial terekspos, kelemahan API, miskonfigurasi CORS).
2. HINDARI FALSE POSITIVES. Jangan laporkan peringatan linter biasa atau kode yang sekadar "kurang rapi" jika tidak ada dampak keamanannya.
3. Untuk setiap kerentanan keamanan nyata (OWASP Top 10), buatkan kode perbaikan (Auto-Remediation) yang aman, efisien, dan siap diimplementasikan.
4. Jika kode sepenuhnya aman dan tidak ditemukan celah sama sekali, kembalikan array kosong: []
5. WAJIB MENGGUNAKAN BAHASA INDONESIA YANG BAKU DAN MUDAH DIPAHAMI UNTUK SEMUA DESKRIPSI.


OUTPUT HARUS MURNI JSON ARRAY dengan skema berikut (Key JSON tetap dalam bahasa Inggris, nilainya dalam Bahasa Indonesia):
[
  {
    "severity": "critical" | "high" | "medium" | "low" | "info",
    "vulnerability_type": "string (Contoh: 'Reflected XSS', 'Hardcoded API Key', 'SQL Injection')",
    "description": "string (Penjelasan teknis detail dalam BAHASA INDONESIA tentang celah ini dan potensi dampaknya)",
    "file_path": "string (Gunakan path asli jika ada, atau kembalikan '${targetUrl}')",
    "patched_code": "string (Tulis ulang cuplikan kode tersebut dengan perbaikan keamanannya. Format dengan rapi)",
    "simulation": {
      "attacker_log": "Penjelasan dari sudut pandang Hacker (Red Agent) tentang bagaimana dia akan membobol celah ini, lengkapi dengan contoh payload eksploitasinya.",
      "defender_log": "Penjelasan dari sudut pandang Security Engineer (Blue Agent) tentang bagaimana patch kode yang diberikan akan memblokir serangan dari Red Agent tersebut."
  }
]

Selain mencari kerentanan OWASP, Anda HARUS bertindak sebagai "Secret Scanner".
Cari pola string yang terlihat seperti kredensial sensitif yang *hardcoded* (ditulis langsung) di dalam kode target, seperti:
- Token GitHub (ghp_...)
- Kunci API AWS (AKIA...)
- URL Database dengan password (postgres://user:password@...)
- Kunci Rahasia JWT (JSON Web Token)
- Kunci API layanan pihak ketiga (Stripe, Supabase, OpenAI, dll)

Jika Anda menemukan kredensial yang bocor:
1. Kategorikan sebagai "vulnerability_type": "Exposed Secret / Hardcoded Credential".
2. Set "severity" menjadi "critical".
3. Pada bagian "description", jelaskan risiko pengambilalihan akun/sistem akibat kebocoran kunci tersebut.
4. Pada bagian "remediations" (patched_code), ubah kode tersebut untuk menggunakan Environment Variables (misalnya process.env.SECRET_KEY)

Jika Anda menemukan file "package.json", lakukan analisis SBOM (Software Bill of Materials):
1. Ekstrak nama dan versi dari setiap library di dalam "dependencies" dan "devDependencies".
2. Cek silang setiap library dengan database kerentanan (CVE).
3. Jika menemukan library usang atau rentan (misalnya axios versi < 1.0.0 rentan terhadap SSRF), catat sebagai Vulnerability dengan tipe "Vulnerable Component" dan beri tag CVE terkait.`

      try {
        // ==========================================================
        // TAHAP 1: AI PERTAMA MEMBUAT DRAFT LAPORAN (MULT-AGENT SCAN)
        // ==========================================================
        const response1 = await ai.models.generateContent({
          model: 'gemini-2.5-flash', 
          contents: systemPrompt,
          config: { 
            responseMimeType: "application/json", 
            temperature: 0.1, 
            topP: 0.8
          }
        })

        const initialDraft = response1.text?.replace(/```json/gi, "").replace(/```/g, "").trim() || "[]";
        
        // ==========================================================
        // TAHAP 2: AI AUDITOR MELAKUKAN QUALITY CONTROL (REFLECTION)
        // ==========================================================
        const auditorPrompt = `Kamu adalah "Auditor Keamanan Senior" (Quality Control).
Tugasmu adalah memeriksa dan mereview laporan kerentanan (format JSON) yang dibuat oleh AI Junior.

--- SOURCE CODE ASLI (Dipotong untuk konteks) ---
${fetchResult.code.substring(0, 30000)}

--- LAPORAN JSON DARI AI JUNIOR ---
${initialDraft}

TUGAS ANDA SEBAGAI AUDITOR:
1. Periksa kolom "patched_code". Pastikan BENAR-BENAR AMAN.
2. HANYA hapus temuan jika Anda 100% YAKIN itu adalah False Positive (misal: variabel bernama 'password' tapi sebenarnya bukan kredensial). JIKA RAGU, BIARKAN TEMUAN TERSEBUT TETAP ADA.
3. ATURAN MUTLAK: Anda DILARANG KERAS menghapus atau mengubah struktur key "simulation" beserta isinya.

OUTPUT HARUS MURNI JSON ARRAY TANPA TEKS LAIN.`;

        const response2 = await ai.models.generateContent({
          model: 'gemini-2.5-flash', 
          contents: auditorPrompt,
          config: { 
            responseMimeType: "application/json", 
            temperature: 0.1, // Tetap dingin agar akurat
            topP: 0.8
          }
        })

        const finalJson = response2.text?.replace(/```json/gi, "").replace(/```/g, "").trim() || "[]";
        const parsed = JSON.parse(finalJson);
        
        // Memastikan output benar-benar array
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Gemini Parsing/Reflection Error:", e);
        // Jika gagal parsing, kita kirim status error, bukan array kosong agar tidak dianggap "Aman"
        throw new Error("AI gagal menyusun laporan JSON yang valid setelah proses QC Audit."); 
      }
    })

    // 4. PENYIMPANAN DATA DENGAN TRANSACTIONAL LOGIC
    await step.run("log-saving", async () => {
      await supabaseAdmin.from('scans').update({ current_action: ` Menyusun ${aiAnalysis.length} temuan keamanan (Tervalidasi Auditor) dan menyempurnakan skrip Auto-Patch...` }).eq('id', scanId)
    })

    await step.run("save-vulnerabilities", async () => {
      if (!aiAnalysis || aiAnalysis.length === 0) return;
      
      for (const vuln of aiAnalysis) {
        // Validasi struktur sebelum insert untuk mencegah DB Error
        if (!vuln.severity || !vuln.vulnerability_type) continue;

        const { data: insertedVuln } = await supabaseAdmin.from('vulnerabilities').insert({
          scan_id: scanId, 
          severity: vuln.severity, 
          vulnerability_type: vuln.vulnerability_type,
          description: vuln.description || "Tidak ada deskripsi.", 
          file_path: vuln.file_path || targetUrl,
          simulation: vuln.simulation || {}
        }).select().single()

        if (insertedVuln && vuln.patched_code) {
          await supabaseAdmin.from('remediations').insert({
            vulnerability_id: insertedVuln.id, 
            patched_code: vuln.patched_code, 
            original_code: "// Kerentanan dideteksi oleh Galaxytus AI"
          })
        }
      }
    })

    // 5. PENILAIAN GRADE KEAMANAN AKHIR
    await step.run("complete-scan", async () => {
      // Logika Penilaian Dinamis
      let finalGrade = 'A';
      if (aiAnalysis.some((v:any) => v.severity === 'critical')) finalGrade = 'F';
      else if (aiAnalysis.some((v:any) => v.severity === 'high')) finalGrade = 'D';
      else if (aiAnalysis.some((v:any) => v.severity === 'medium')) finalGrade = 'C';
      else if (aiAnalysis.some((v:any) => v.severity === 'low')) finalGrade = 'B';

      await supabaseAdmin.from('scans').update({ 
        status: 'completed',
        current_action: ' Pemindaian, Audit QC, dan perakitan laporan selesai sepenuhnya.',
        score_grade: finalGrade,
        completed_at: new Date().toISOString()
      }).eq('id', scanId)
    })

    return { success: true, totalFound: aiAnalysis.length }
  }
)