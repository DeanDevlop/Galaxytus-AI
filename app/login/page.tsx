import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { GitBranch, Fingerprint } from 'lucide-react'
import { login, loginWithGithub } from './actions' 

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Card className="w-full max-w-md shadow-2xl border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700">
        
        <CardHeader className="space-y-4 text-center pb-10 pt-10 px-8 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex justify-center">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <Fingerprint className="w-10 h-10 text-zinc-900 dark:text-zinc-100" />
            </div>
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tighter text-zinc-950 dark:text-white">
            Welcome back.
          </CardTitle>
          <CardDescription className="text-zinc-500 text-base max-w-xs mx-auto text-balance">
            Otentikasi identitas Anda untuk masuk ke sistem keamanan Galaxytus.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-10 px-8">
          <form className="space-y-6" action={login}>
            
            <div className="space-y-2.5">
              <Label htmlFor="email" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                Email Address
              </Label>
              <Input 
                id="email" name="email" type="email" placeholder="engineer@company.com" required 
                className="h-12 rounded-full px-5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
              />
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                  Password
                </Label>
                {/* INI KABELNYA: Mengarah tepat ke rute forgot-password yang baru kita buat */}
                <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-semibold underline-offset-4 hover:underline transition-colors">
                  Lupa password?
                </Link>
              </div>
              <Input 
                id="password" name="password" type="password" placeholder="••••••••" required 
                className="h-12 rounded-full px-5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
              />
            </div>

            {params?.message && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {params.message}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-full bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold text-sm shadow-xl transition-all hover:scale-[1.01]">
              Sign In to System
            </Button>
          </form>

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

          <form action={loginWithGithub}>
            <Button type="submit" variant="outline" className="w-full h-12 rounded-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold transition-all">
              <GitBranch className="mr-2.5 h-5 w-5" /> Sign in with GitHub
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-8 pb-10 px-8 text-center">
          <p className="text-sm text-zinc-500">
            Belum punya akses?{' '}
            <Link href="/register" className="text-zinc-900 dark:text-white font-bold hover:underline transition-colors">
              Minta akses di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}