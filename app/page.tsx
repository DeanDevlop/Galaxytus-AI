import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/landing/Navbar"
import { Button } from "@/components/ui/button"
import { ArrowRight, BotMessageSquare, ShieldCheck, GitBranch, ShieldAlert } from "lucide-react"

const features = [
  {
    icon: <BotMessageSquare className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />,
    title: "AI Cybersecurity Agent",
    description: "Agen AI otonom yang bekerja 24/7 menganalisis source code menggunakan kecerdasan Gemini 2.5 Flash."
  },
  {
    icon: <ShieldAlert className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />,
    title: "Hybrid SAST/DAST",
    description: "Kombinasi analisis kode statis dan dinamis untuk menemukan celah OWASP Top 10 tanpa False Positives."
  },
  {
    icon: <GitBranch className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />,
    title: "Auto Pull Request",
    description: "AI kami langsung menyusun dan mengirim Pull Request perbaikan otomatis ke repositori GitHub Anda."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />,
    title: "Owner Verification",
    description: "Sistem keamanan industri untuk memastikan hanya pemilik sah yang dapat memindai target mereka."
  }
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800 font-sans overflow-x-hidden">
      <Navbar />

      {/* Gunakan tag <main> untuk membungkus konten dan memberikan jarak pasti */}
      <main className="flex-1 flex flex-col w-full">
        
        {/* ========================================= */}
        {/* HERO SECTION - TINGGI MINIMAL 90% LAYAR */}
        {/* ========================================= */}
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 mt-10">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-100 via-white to-white dark:from-zinc-900 dark:via-black dark:to-black opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto w-full">
            
            {/* PASTIKAN LOGO ADA DI FOLDER PUBLIC */}
            <div className="mb-10 select-none pointer-events-none flex justify-center w-full">
              <Image 
                src="/logo.png" 
                alt="Galaxytus AI Logo" 
                width={280} 
                height={80} 
                className="dark:invert opacity-90 object-contain h-16 w-auto"
                priority
              />
            </div>

            <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 mb-8 py-2 px-5 rounded-full text-xs tracking-wide font-medium shadow-sm">
              Galaxytus Security Engine v2.0
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 text-balance">
              Secure your code.<br className="hidden md:block"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                Powered by Agentic AI.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed mb-12 text-balance">
              Auditor Keamanan otonom untuk developer modern. Temukan kerentanan fatal dan terima kode perbaikan otomatis dalam hitungan detik.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-full px-10 h-14 text-base font-semibold transition-all shadow-lg">
                  Start for free
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 rounded-full px-10 h-14 text-base font-medium transition-all">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* FEATURES SECTION - JARAK LEGA (py-32) */}
        {/* ========================================= */}
        <section id="features" className="w-full py-32 bg-zinc-50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-20 md:text-center flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Mendefinisikan Ulang Keamanan.</h2>
              <p className="text-zinc-500 text-lg max-w-2xl md:mx-auto text-balance">Hentikan audit manual yang lambat. Platform kami dirancang untuk kecepatan, akurasi, dan perbaikan instan.</p>
            </div>
            
            <div className="grid gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-start group">
                  <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors group-hover:border-zinc-400 dark:group-hover:border-zinc-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight mb-3">{feature.title}</h3>
                  <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================= */}
        {/* CTA SECTION - JARAK LEGA (py-32) */}
        {/* ========================================= */}
        <section className="w-full py-32 border-t border-zinc-100 dark:border-zinc-900 text-center px-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-balance">Siap mengamankan proyek Anda?</h2>
            <p className="text-zinc-500 mb-12 text-xl text-balance">Bergabunglah dan biarkan AI kami yang menangani celah keamanan Anda.</p>
            <Link href="/register">
              <Button size="lg" className="bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-full px-12 h-16 text-lg font-semibold shadow-2xl transition-transform hover:scale-105">
                Daftar Sekarang <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* ========================================= */}
      {/* CLEAN FOOTER */}
      {/* ========================================= */}
      <footer className="w-full py-12 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-sm">
          <div className="flex items-center gap-3">
            <Image 
               src="/logo.png" 
               alt="Logo" 
               width={32} 
               height={32} 
               className="dark:invert grayscale opacity-50 object-contain h-8 w-auto" 
               // Tambahkan unoptimized jika error berlanjut: unoptimized
            />
            <span className="font-medium">&copy; {new Date().getFullYear()} Galaxytus AI.</span>
          </div>
          <p>UKK SMK Portofolio Project by UKKdean.</p>
        </div>
      </footer>

    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      {children}
    </div>
  )
}