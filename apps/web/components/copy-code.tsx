"use client"

import { useEffect } from "react"

export function CopyCode() {
  useEffect(() => {
    const figures = document.querySelectorAll<HTMLElement>(
      "[data-rehype-pretty-code-figure]"
    )

    const buttons: HTMLButtonElement[] = []

    figures.forEach((figure) => {
      if (figure.querySelector(".copy-code-btn")) return

      const btn = document.createElement("button")
      btn.className =
        "copy-code-btn absolute top-2 right-2 rounded p-1 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted transition-colors"
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'

      const checkSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      const copySvg = btn.innerHTML

      btn.addEventListener("click", () => {
        const code = figure.querySelector("code")?.innerText ?? ""
        navigator.clipboard.writeText(code)
        btn.innerHTML = checkSvg
        setTimeout(() => {
          btn.innerHTML = copySvg
        }, 1500)
      })

      figure.appendChild(btn)
      buttons.push(btn)
    })

    return () => {
      buttons.forEach((btn) => btn.remove())
    }
  }, [])

  return null
}
