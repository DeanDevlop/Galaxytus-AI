"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// 1. Tambahkan type 'indicatorColor' ke dalam Props bawaan
function Progress({
  className,
  value,
  indicatorColor, // <--- KITA TANGKAP PROPERTINYA DI SINI
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorColor?: string }) { 
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-hidden rounded-full bg-secondary/30",
        className
      )}
      {...props} // Karena indicatorColor sudah ditangkap di atas, dia tidak akan bocor ke sini
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // 2. TEMPELKAN WARNANYA KE BAGIAN INDIKATOR (BAR DALAM)
        className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorColor)} 
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }