"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { DatePicker } from "@/components/reui/date-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function ReportsDateFilter({ reportKey, defaultFrom, defaultTo }: { reportKey: string; defaultFrom?: string; defaultTo?: string }) {
  const router = useRouter()
  const [from, setFrom] = useState(defaultFrom ?? "")
  const [to, setTo] = useState(defaultTo ?? "")

  function apply() {
    const params = new URLSearchParams({ report: reportKey })
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label>From</Label>
        <DatePicker value={from || undefined} onValueChange={setFrom} placeholder="Start date" className="w-40" />
      </div>
      <div className="space-y-1">
        <Label>To</Label>
        <DatePicker value={to || undefined} onValueChange={setTo} placeholder="End date" className="w-40" />
      </div>
      <Button type="button" variant="secondary" onClick={apply}>Apply</Button>
    </div>
  )
}
