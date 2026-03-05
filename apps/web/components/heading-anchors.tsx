"use client"

import { useEffect } from "react"

/** Intercepts clicks on .heading-anchor links and copies the URL to clipboard */
export function HeadingAnchors() {
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a.heading-anchor")
      if (!a) return
      e.preventDefault()
      navigator.clipboard.writeText((a as HTMLAnchorElement).href).catch(() => {})
    }
    document.addEventListener("click", handle)
    return () => document.removeEventListener("click", handle)
  }, [])
  return null
}
