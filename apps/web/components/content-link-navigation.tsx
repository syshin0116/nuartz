"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { stripBasePath } from "@/lib/base-path"

/**
 * Note bodies are injected as HTML, so their links are plain <a> tags that
 * reload the whole page. Route same-origin page links through the App Router.
 */
export function ContentLinkNavigation() {
  const router = useRouter()
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.<HTMLAnchorElement>(".prose a[href]")
      if (!anchor || anchor.target && anchor.target !== "_self" || anchor.hasAttribute("download")) return
      const url = new URL(anchor.href, location.href)
      const pathname = stripBasePath(url.pathname)
      if (url.origin !== location.origin || pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(pathname)) return
      // Same-page anchors keep the browser's native scrolling.
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return
      event.preventDefault()
      // router.push adds basePath itself.
      router.push(pathname + url.search + url.hash)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [router])
  return null
}
