'use client'

import { useState, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { updatePasswordExecute } from '../login/actions'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = use(searchParams)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (password !== confirmPassword) {
      e.preventDefault()
      setClientError('Integritas kredensial gagal diverifikasi (Tidak cocok).')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Card className="w-full max-w-md shadow-2xl border-red-200 dark:border-red-900/30 rounded-3xl overflow-hidden relative">
        {/* Indikator Zona Kritis */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        
        <CardHeader className="space-y-4 text-center pb-8 pt-10 px-8 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-3xl border border-red-100 dark:border-red-900/50 shadow-inner">
              <KeyRound className="w-10 h-10 text-red-600 dark:text-red-500 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tighter text-zinc-950 dark:text-white">
            Secure Vault.
          </CardTitle>
          <CardDescription className="text-zinc-500 text-sm max-w-xs mx-auto text-balance">
            Sesi pemulihan terenkripsi aktif. Masukkan kredensial baru Anda.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-8 px-8 pb-10">
          <form className="space-y-6" onSubmit={handleSubmit} action={updatePasswordExecute}>
            <div className="space-y-2.5">
              <Label htmlFor="password" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                New Security Key
              </Label>
              <div className="relative">
                <Input 
                  id="password" name="password" 
                  type={showPassword ? "text" : "password"} 
                  required minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-full pl-5 pr-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-red-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                Verify New Key
              </Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirm ? "text" : "password"} 
                  required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-12 rounded-full pl-5 pr-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${confirmPassword && password !== confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-red-500'}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {(clientError || params?.message) && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {clientError || params?.message}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl transition-all">
              Execute Protocol Override
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}