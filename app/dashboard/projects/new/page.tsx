import { createProject } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register Target</h1>
          <p className="text-zinc-500">Daftarkan aplikasi yang ingin diuji keamanannya.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Konfigurasi</CardTitle>
          <CardDescription>Pilih tipe target, AI kami akan menyesuaikan metode pemindaiannya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Proyek</Label>
              <Input id="name" name="name" placeholder="Misal: API Payment Gateway" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea id="description" name="description" placeholder="Aplikasi berbasis Next.js dan Supabase..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceType">Tipe Target</Label>
              <Select name="sourceType" required defaultValue="web_url">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe sumber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_url">Live Website URL (DAST)</SelectItem>
                  <SelectItem value="github">GitHub Repository (SAST)</SelectItem>
                  <SelectItem value="ip_address">Server IP Address (Network Scan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL / Endpoint</Label>
              <Input id="targetUrl" name="targetUrl" placeholder="https://ecommerce-anda.com" required />
              <p className="text-xs text-zinc-500">Pastikan Anda memiliki izin legal (otorisasi) untuk melakukan penetrasi pada target ini.</p>
            </div>

            {params?.error && (
              <p className="text-sm text-red-500 font-medium">{params.error}</p>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/projects">
                <Button type="button" variant="ghost">Batal</Button>
              </Link>
              <Button type="submit">Simpan & Daftarkan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}