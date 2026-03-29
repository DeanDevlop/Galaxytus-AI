import Link from 'next/link'
import { 
  LayoutDashboard, 
  ShieldAlert, 
  FolderGit2, 
  Activity, 
  Settings, 
  LogOut 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image';
import { logout } from '../login/actions'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 md:flex">
        <div className="flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800 px-6">
       <Image
      src="/images/planet.png"
      alt="Deskripsi gambar"
      width={80} // Wajib diisi untuk optimasi
      height={300} // Wajib diisi untuk optimasi
    />
          <span className="text-lg font-bold tracking-tight">Galaxytus AI</span>
        </div>
        
        <nav className="flex-1 space-y-2 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </Button>
          </Link>
          <Link href="/dashboard/projects">
            <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              <FolderGit2 className="mr-2 h-4 w-4" />
              Projects Target
            </Button>
          </Link>
          <Link href="/dashboard/scans">
            <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              <Activity className="mr-2 h-4 w-4" />
              Scan History
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </nav>

         <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
          {/* 2. Ganti URL API dengan action={logout} */}
          <form action={logout}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-950/50">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col">
        {/* TOP NAVBAR (Mobile View & User Profile) */}
        <header className="flex h-14 items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 md:justify-end">
          {/* Hamburger menu untuk mobile bisa ditambahkan di sini nanti */}
          <div className="font-medium text-sm border rounded-full px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            Personal Workspace
          </div>
        </header>

        {/* HALAMAN DINAMIS (Ini akan merender page.tsx) */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>

    </div>
  )
}