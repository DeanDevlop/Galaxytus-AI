import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { runAiPentest } from "@/app/api/inngest/functions"

// Kita HANYA mendaftarkan runAiPentest di sini, helloWorld sudah kita buang ke tempat sampah!
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runAiPentest,
  ],
})