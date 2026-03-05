"use client"

import { useEffect } from "react"

export function PopoverPreview() {
  useEffect(() => {
    let popup: HTMLDivElement | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let controller: AbortController | null = null

    function hide() {
      if (timer) { clearTimeout(timer); timer = null }
      if (controller) { controller.abort(); controller = null }
      if (popup) { popup.remove(); popup = null }
    }

    function handleEnter(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("article.prose a.wikilink") as HTMLAnchorElement | null
      if (!a) return

      hide()

      const href = a.getAttribute("href")
      if (!href) return
      const slug = href.startsWith("/") ? href.slice(1) : href

      const x = e.clientX
      const y = e.clientY

      timer = setTimeout(async () => {
        controller = new AbortController()
        try {
          const res = await fetch(`/api/preview?slug=${encodeURIComponent(slug)}`, {
            signal: controller.signal,
          })
          if (!res.ok) return
          const { title, excerpt } = await res.json()

          popup = document.createElement("div")
          popup.className =
            "fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 max-w-[280px] text-sm pointer-events-none"

          popup.innerHTML = `<div class="font-medium">${escapeHtml(title)}</div><div class="text-muted-foreground text-xs mt-1 line-clamp-3">${escapeHtml(excerpt)}</div>`

          document.body.appendChild(popup)

          // Position and clamp to viewport
          const rect = popup.getBoundingClientRect()
          let left = x
          let top = y + 16
          if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8
          if (left < 8) left = 8
          if (top + rect.height > window.innerHeight - 8) top = y - rect.height - 8

          popup.style.left = `${left}px`
          popup.style.top = `${top}px`
        } catch {
          // aborted or failed
        }
      }, 350)
    }

    function handleLeave(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("article.prose a.wikilink")
      if (!a) return
      hide()
    }

    document.addEventListener("mouseover", handleEnter)
    document.addEventListener("mouseout", handleLeave)

    return () => {
      hide()
      document.removeEventListener("mouseover", handleEnter)
      document.removeEventListener("mouseout", handleLeave)
    }
  }, [])

  return null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
