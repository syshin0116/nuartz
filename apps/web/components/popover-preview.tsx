"use client"

import { useEffect } from "react"

export function PopoverPreview() {
  useEffect(() => {
    let popup: HTMLDivElement | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let controller: AbortController | null = null
    let previewIndex: Record<string, { title: string; excerpt: string }> | null = null

    // Try loading static preview index (for static export)
    fetch("/preview-index.json")
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { previewIndex = data })
      .catch(() => { /* no static index, will use API */ })

    function hide() {
      if (timer) { clearTimeout(timer); timer = null }
      if (controller) { controller.abort(); controller = null }
      if (popup) { popup.remove(); popup = null }
    }

    function handleEnter(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("article.prose a") as HTMLAnchorElement | null
      if (!a) return

      const href = a.getAttribute("href")
      if (!href) return

      const isExternal = href.startsWith("http://") || href.startsWith("https://")
      const isWikilink = a.classList.contains("wikilink")

      if (!isWikilink && !isExternal) return

      hide()

      const x = e.clientX
      const y = e.clientY

      timer = setTimeout(async () => {
        controller = new AbortController()
        try {
          let data: { title: string; excerpt: string; image?: string; type?: string }

          const slug = href.startsWith("/") ? href.slice(1) : href

          // Use static preview index for internal links when available
          if (!isExternal && previewIndex && previewIndex[slug]) {
            data = { ...previewIndex[slug], type: "internal" }
          } else {
            const apiUrl = isExternal
              ? `/api/preview?url=${encodeURIComponent(href)}`
              : `/api/preview?slug=${encodeURIComponent(slug)}`

            const res = await fetch(apiUrl, { signal: controller.signal })
            if (!res.ok) return
            data = await res.json()
          }

          popup = document.createElement("div")
          popup.className =
            "fixed z-50 rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 max-w-[320px] text-sm pointer-events-none"

          let inner = `<div class="font-medium leading-snug">${escapeHtml(data.title)}</div>`

          if (data.image && data.type === "external") {
            inner += `<img src="${escapeHtml(data.image)}" class="mt-2 w-full rounded object-cover max-h-[120px]" loading="lazy" />`
          }

          if (data.excerpt) {
            inner += `<div class="text-muted-foreground text-xs mt-1 line-clamp-4">${escapeHtml(data.excerpt)}</div>`
          }

          if (data.type === "external") {
            const domain = new URL(href).hostname.replace(/^www\./, "")
            inner += `<div class="text-muted-foreground/60 text-xs mt-1">${escapeHtml(domain)}</div>`
          }

          popup.innerHTML = inner
          document.body.appendChild(popup)

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
      }, 250)
    }

    function handleLeave(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("article.prose a")
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
