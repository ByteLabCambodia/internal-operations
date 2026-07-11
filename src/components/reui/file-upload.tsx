"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { UploadCloud, FileText, X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface FileUploadProps {
  value?: File | null
  onChange?: (file: File | null) => void
  accept?: string
  className?: string
  children?: React.ReactNode // rendered below when a file is selected (e.g. scan button)
}

export function FileUpload({ value, onChange, accept, className, children }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(false)

  const previewUrl = useMemo(
    () => (value?.type.startsWith("image/") ? URL.createObjectURL(value) : null),
    [value],
  )
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  function handleFile(file: File | null) {
    onChange?.(file)
  }

  function clear() {
    handleFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  if (value) {
    const sizeMb = (value.size / 1024 / 1024).toFixed(2)
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          {previewUrl ? (
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="group relative h-10 w-10 shrink-0 overflow-hidden rounded"
            >
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="size-4 text-white" />
              </div>
            </button>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-muted-foreground">{sizeMb} MB</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}

        {previewUrl && (
          <Dialog open={preview} onOpenChange={setPreview}>
            <DialogContent
              className="max-w-3xl p-2"
              showCloseButton
            >
              <img
                src={previewUrl}
                alt={value.name}
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-input px-6 py-8 text-center transition-colors",
        dragging ? "border-ring bg-muted/50" : "hover:border-ring/60 hover:bg-muted/20",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0] ?? null
        if (file) handleFile(file)
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <UploadCloud className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          <span className="text-primary">Click to upload</span> or drag & drop
        </p>
        {accept && (
          <p className="text-xs text-muted-foreground">
            {accept.replace(/,\s*/g, " · ")}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
