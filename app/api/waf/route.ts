import { GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: Request) {
  try {
    const { vulnType, description, filePath } = await req.json()

    const systemPrompt = `Kamu adalah Galaxytus NetSec AI (Network Security Engineer).
Tugasmu adalah membuat "Virtual Patch" atau aturan WAF (Web Application Firewall) untuk memitigasi celah keamanan berikut, SEMENTARA menunggu tim developer memperbaiki kodenya.

--- TARGET INFO ---
Tipe Celah: ${vulnType}
Deskripsi: ${description}
Endpoint/File: ${filePath}

INSTRUKSI:
1. Buatkan konfigurasi pemblokiran spesifik untuk Nginx dan Cloudflare WAF (Custom Rule Expression).
2. Jangan memberikan penjelasan panjang lebar. Langsung berikan kodenya.
3. OUTPUT HARUS berupa JSON murni dengan format:
{
  "nginx": "kode konfigurasi nginx di sini",
  "cloudflare": "ekspresi aturan cloudflare di sini",
  "explanation": "Penjelasan singkat 1 kalimat cara kerja rule ini memblokir serangan."
}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: { responseMimeType: "application/json", temperature: 0.1 }
    })

    const rawJson = response.text?.replace(/```json/gi, "").replace(/```/g, "").trim() || "{}"
    const parsed = JSON.parse(rawJson)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("WAF Agent Error:", error)
    return NextResponse.json({ error: "Gagal menyusun WAF Rules." }, { status: 500 })
  }
}