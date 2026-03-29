import { Inngest } from "inngest"

// Inisialisasi client Inngest dengan nama aplikasi kita
export const inngest = new Inngest({ 
  id: "galaxytus-ai-core",
  eventKey: process.env.INNGEST_EVENT_KEY || "local"
})