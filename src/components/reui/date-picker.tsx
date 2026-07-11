"use client"

import { useCallback, useMemo, useState } from "react"
import { format, parseISO, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover } from "@base-ui/react/popover"

import { DateSelector, type DateSelectorValue } from "@/components/reui/date-selector"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onValueChange, placeholder = "Select date…", className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selectorValue = useMemo<DateSelectorValue | undefined>(() => {
    if (!value) return undefined
    const d = parseISO(value)
    if (!isValid(d)) return undefined
    return { period: "day", operator: "is", startDate: d }
  }, [value])

  const handleChange = useCallback(
    (v: DateSelectorValue) => {
      if (v.startDate && isValid(v.startDate)) {
        const str = format(v.startDate, "yyyy-MM-dd")
        if (str !== value) {
          onValueChange?.(str)
          setOpen(false)
        }
      }
    },
    [value, onValueChange],
  )

  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="mr-2 size-4" />
        {selected ? format(selected, "MMM d, yyyy") : placeholder}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" className="z-50 outline-none">
          <Popover.Popup className="rounded-lg border border-border bg-background p-4 shadow-lg outline-none transition-[opacity,transform] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <DateSelector
              value={selectorValue}
              onChange={handleChange}
              allowRange={false}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
