"use client"

import { useEffect } from "react"
import mediumZoom from "medium-zoom"

export function ImageZoom() {
  useEffect(() => {
    const zoom = mediumZoom("article.prose img:not(a img)", {
      margin: 40,
      background: "var(--background)",
    })
    return () => { zoom.detach() }
  }, [])

  return null
}
