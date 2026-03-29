import { GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: Request) {
  try {
    const { prompt, context, history } = await req.json()

    // Prompt ajaib agar AI bertindak sebagai asisten spesifik untuk bug tersebut
    const systemInstruction = `Kamu adalah "Galaxytus AI Copilot", seorang pakar Cybersecurity dan Software Engineer Senior.
    User sedang bertanya kepadamu mengenai kerentanan spesifik yang baru saja kamu temukan di kodenya.
    
    --- KONTEKS KERENTANAN ---
    Tipe Bug: ${context.type}
    File Target: ${context.file}
    Deskripsi: ${context.desc}
    Kode Perbaikan (Patch): ${context.patch || "Belum ada patch spesifik"}
    
    INSTRUKSI:
    1. Jawab pertanyaan user berdasarkan konteks kerentanan di atas.
    2. Gunakan bahasa Indonesia yang santai tapi profesional (seperti programmer ke programmer).
    3. Jika user meminta penjelasan kode, jelaskan baris demi baris secara singkat.
    4. Jika user meminta kode di-translate ke bahasa/framework lain, berikan kodenya dengan rapi.`

    // Format riwayat chat untuk Gemini
    let chatContents = `${systemInstruction}\n\n`;
    
    // Masukkan riwayat chat sebelumnya agar AI tidak pikun
    if (history && history.length > 0) {
       history.forEach((msg: any) => {
          chatContents += `${msg.role === 'user' ? 'User' : 'Copilot'}: ${msg.content}\n\n`;
       });
    }

    chatContents += `User: ${prompt}\nCopilot:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: chatContents,
      config: { temperature: 0.7 } // Temperature agak dinaikkan biar luwes saat ngobrol
    });

    return NextResponse.json({ text: response.text })
  } catch (error) {
    console.error("Copilot Error:", error)
    return NextResponse.json({ error: "Gagal terhubung ke otak Galaxytus AI." }, { status: 500 })
  }
}