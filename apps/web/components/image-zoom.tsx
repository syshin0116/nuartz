"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import mediumZoom from "medium-zoom"

export function ImageZoom() {
  const pathname = usePathname()
  useEffect(() => {
    const zoom = mediumZoom("article.prose img:not(a img)", {
      margin: 40,
      background: "var(--background)",
    })
    return () => { zoom.detach() }
  }, [pathname])

  return null
}
