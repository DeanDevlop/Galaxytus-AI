import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-900 transition-colors">
      {/* Batasi tinggi navbar agar tidak jebol */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* ========================================= */}
        {/* LOGO GALAXYTUS DI NAVBAR (SUDAH DIKUNCI) */}
        {/* ========================================= */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image 
            src="/logo.png" 
            alt="Galaxytus AI" 
            width={120} 
            height={40} 
            // KUNCI UTAMA: h-8 atau h-10 memastikan logo tidak akan pernah membesar melewati navbar
            className="dark:invert h-8 sm:h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* ========================================= */}
        {/* NAV LINKS & BUTTONS (MINIMALIST) */}
        {/* ========================================= */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-full px-6 font-medium transition-all shadow-sm">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="#features" className="hidden md:block text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mr-2">
                Features
              </Link>
              <Link href="/login">
                <Button size="sm" variant="ghost" className="hidden sm:flex text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white rounded-full font-medium transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-full px-6 font-medium transition-all shadow-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}