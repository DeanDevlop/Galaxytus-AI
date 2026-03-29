'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BotMessageSquare, Send, User, Loader2, Sparkles } from "lucide-react"

export default function CopilotChat({ vulnContext }: { vulnContext: any }) {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: `Halo! Saya Galaxytus AI. Ada yang ingin kamu diskusikan tentang kerentanan **${vulnContext.type}** ini?` }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Otomatis scroll ke bawah tiap ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          history: messages,
          context: {
            type: vulnContext.type,
            file: vulnContext.file,
            desc: vulnContext.desc,
            patch: vulnContext.patch
          }
        })
      })

      const data = await res.json()
      if (data.text) {
        setMessages(prev => [...prev, { role: 'ai', content: data.text }])
      } else {
         throw new Error("No response")
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Maaf, koneksi saya ke server inti terputus. Coba lagi ya." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[500px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
      {/* Header Chat */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3">
        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Galaxytus</h4>
          <p className="text-xs text-zinc-500">Tanyakan apa saja tentang bug ini.</p>
        </div>
      </div>

      {/* Area Pesan */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-emerald-100 dark:bg-emerald-900'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-600 dark:text-zinc-300" /> : <BotMessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}>
               {/* Karena text AI mungkin panjang, kita render biasa dulu. Kalau mau lebih pro nanti bisa pakai Markdown renderer */}
               <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Area Input */}
      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Tanyakan cara kerja patch ini..." 
          className="flex-1 rounded-full bg-zinc-100 dark:bg-zinc-950 border-transparent focus-visible:ring-emerald-500"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}