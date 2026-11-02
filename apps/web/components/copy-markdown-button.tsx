"use client"

import { useState } from "react"
import { Check, Copy, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { withBasePath } from "@/lib/base-path"

/** Copies the note's portable Markdown (/md/<slug>.md), e.g. to paste into an AI chat. */
export function CopyMarkdownButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const href = withBasePath(`/md/${slug.split("/").map(encodeURIComponent).join("/")}.md`)
  const copy = async () => {
    try {
      const response = await fetch(href)
      if (!response.ok) throw new Error(String(response.status))
      await navigator.clipboard.writeText(await response.text())
      setState("copied")
    } catch {
      setState("failed")
    }
    setTimeout(() => setState("idle"), 2000)
  }
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground" onClick={copy} aria-live="polite">
        {state === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy Markdown"}
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground" asChild>
        <a href={href} target="_blank" rel="noopener"><FileText className="size-3.5" />View Markdown</a>
      </Button>
    </div>
  )
}
