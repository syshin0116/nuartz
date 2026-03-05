"use client"

import { useEffect } from "react"

export function MermaidRenderer() {
  useEffect(() => {
    async function render() {
      const blocks = document.querySelectorAll("code.language-mermaid")
      if (!blocks.length) return
      const mermaid = (await import("mermaid")).default
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        securityLevel: "loose",
      })
      for (const block of Array.from(blocks)) {
        const pre = block.parentElement
        if (!pre) continue
        const definition = block.textContent ?? ""
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2)}`
          const { svg } = await mermaid.render(id, definition)
          const container = document.createElement("div")
          container.className = "mermaid-diagram my-4 overflow-x-auto"
          container.innerHTML = svg
          pre.replaceWith(container)
        } catch (e) {
          console.error("Mermaid render error:", e)
        }
      }
    }
    render()
  }, [])
  return null
}
