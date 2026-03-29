'use client' // WAJIB: Agar kita bisa pakai useState untuk fitur "Mata"

import { useState, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { GitBranch, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { signup } from '../login/actions' 

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  // Buka "amplop" promise dari Next.js 15+ menggunakan hook 'use'
  const params = use(searchParams)
  
  // State untuk Toggle Mata
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // State untuk nyimpen inputan user biar bisa dibandingin
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState('')

  // Fungsi pencegat sebelum form dikirim ke server (Server Action)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (password !== confirmPassword) {
      e.preventDefault() // Hentikan pengiriman ke server!
      setClientError('Password dan Konfirmasi Password tidak cocok!')
    } else {
      setClientError('') // Bersihkan error jika sudah cocok
      // Biarkan formAction (signup) berjalan secara natural
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Card className="w-full max-w-md shadow-2xl border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700">
        
        {/* HEADER */}
        <CardHeader className="space-y-4 text-center pb-10 pt-10 px-8 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex justify-center">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-zinc-900 dark:text-zinc-100" />
            </div>
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tighter text-zinc-950 dark:text-white">
            Create account.
          </CardTitle>
          <CardDescription className="text-zinc-500 text-base max-w-xs mx-auto text-balance">
            Daftar untuk mengamankan repositori kode Anda dengan AI.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-10 px-8">
          {/* Tambahkan onSubmit untuk mencegat form */}
          <form className="space-y-6" onSubmit={handleSubmit} action={signup}>
            
            <div className="space-y-2.5">
              <Label htmlFor="email" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                Email Address
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="engineer@company.com" 
                required 
                className="h-12 rounded-full px-5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
              />
            </div>
            
            {/* PASSWORD UTAMA DENGAN MATA */}
            <div className="space-y-2.5">
              <Label htmlFor="password" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  // Tipe input dinamis berdasarkan state
                  type={showPassword ? "text" : "password"} 
                  placeholder="Minimal 8 karakter"
                  required 
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-full pl-5 pr-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
                />
                {/* Tombol Mata */}
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 pl-2">
                1 huruf besar, 1 angka, & 1 simbol (Misal: <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">G4l4xytus@2026!</span>)
              </p>
            </div>

            {/* KONFIRMASI PASSWORD DENGAN MATA */}
            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                Ulangi Password
              </Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  // Kita tidak perlu kasih name="confirmPassword" karena yang dikirim ke server cuma password utama
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Ketik ulang password"
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  // Beri efek merah jika tidak cocok saat mengetik
                  className={`h-12 rounded-full pl-5 pr-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ${
                    confirmPassword && password !== confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* AREA ERROR MESSAGE */}
            {/* Prioritaskan error dari client (tidak cocok), kalau tidak ada baru tampilkan error dari server */}
            {(clientError || params?.message) && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {clientError || params?.message}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-full bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold text-sm shadow-xl transition-all hover:scale-[1.01]"
            >
              Sign Up for Free
            </Button>
          </form>

          {/* SSO GITHUB */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-100 dark:border-zinc-900" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-medium">
              <span className="bg-white dark:bg-zinc-950 px-3 text-zinc-400">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-12 rounded-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold transition-all">
            <GitBranch className="mr-2.5 h-5 w-5" /> GitHub
          </Button>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-8 pb-10 px-8 text-center">
          <p className="text-sm text-zinc-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-zinc-900 dark:text-white font-bold hover:underline transition-colors">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}