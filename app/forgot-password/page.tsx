import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import { resetPasswordRequest } from '../login/actions' 

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Card className="w-full max-w-md shadow-2xl border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <CardHeader className="space-y-4 text-center pb-8 pt-10 px-8 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex justify-center">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <ShieldAlert className="w-10 h-10 text-zinc-900 dark:text-zinc-100" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tighter text-zinc-950 dark:text-white">
            System Recovery.
          </CardTitle>
          <CardDescription className="text-zinc-500 text-sm max-w-xs mx-auto text-balance">
            Kirim protokol pemulihan akses ke alamat email Anda.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-8 px-8">
          <form className="space-y-6" action={resetPasswordRequest}>
            <div className="space-y-2.5">
              <Label htmlFor="email" className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                Registered Email
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="h-12 rounded-full px-5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
              />
            </div>

            {params?.message && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400 text-center font-medium">
                  {params.message}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-full bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold text-sm shadow-xl">
              Transmit Recovery Protocol
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-4 pb-10 px-8 text-center">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors">
            Batalkan protokol pemulihan
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}