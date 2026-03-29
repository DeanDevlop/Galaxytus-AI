'use client'

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="fixed bottom-10 right-10 bg-black text-white px-6 py-3 rounded-full shadow-2xl print:hidden hover:bg-zinc-800 transition-all font-bold"
    >
      Cetak Laporan
    </button>
  )
}