"use client"

import { useEffect } from "react"

const copySvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'
const checkSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'

function addCopyButton(container: HTMLElement, codeEl: HTMLElement, elements: HTMLElement[]) {
  if (container.querySelector(".copy-code-btn")) return

  const btn = document.createElement("button")
  btn.className = "copy-code-btn"
  btn.setAttribute("aria-label", "Copy code")

  // Two icons stacked via CSS grid, check icon hidden by default
  const icons = document.createElement("span")
  icons.style.cssText = "display:grid;place-items:center"

  const copyIcon = document.createElement("span")
  copyIcon.innerHTML = copySvg
  copyIcon.style.cssText = "grid-area:1/1;transition:opacity .2s,transform .2s;display:flex"

  const checkIcon = document.createElement("span")
  checkIcon.innerHTML = checkSvg
  checkIcon.style.cssText = "grid-area:1/1;transition:opacity .2s,transform .2s;display:flex;opacity:0;transform:scale(0.5)"

  icons.appendChild(copyIcon)
  icons.appendChild(checkIcon)
  btn.appendChild(icons)

  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(codeEl.innerText ?? "")
    // Animate: fade out copy, fade in check
    copyIcon.style.opacity = "0"
    copyIcon.style.transform = "scale(0.5)"
    checkIcon.style.opacity = "1"
    checkIcon.style.transform = "scale(1)"
    checkIcon.style.color = "#22c55e"

    setTimeout(() => {
      copyIcon.style.opacity = "1"
      copyIcon.style.transform = "scale(1)"
      checkIcon.style.opacity = "0"
      checkIcon.style.transform = "scale(0.5)"
    }, 1500)
  })

  container.appendChild(btn)
  elements.push(btn)
}

export function CopyCode() {
  useEffect(() => {
    const elements: HTMLElement[] = []

    // 1. rehype-pretty-code figures (with language)
    document.querySelectorAll<HTMLElement>("[data-rehype-pretty-code-figure]").forEach((figure) => {
      const pre = figure.querySelector("pre")
      const lang = pre?.getAttribute("data-language")

      if (lang && !figure.querySelector(".code-lang-label")) {
        const label = document.createElement("span")
        label.className = "code-lang-label"
        label.textContent = lang
        figure.appendChild(label)
        elements.push(label)
      }

      const code = figure.querySelector("code")
      if (code) addCopyButton(figure, code, elements)
    })

    // 2. Plain <pre> blocks (no language specified, not inside a figure)
    document.querySelectorAll<HTMLPreElement>(".prose pre").forEach((pre) => {
      if (pre.closest("[data-rehype-pretty-code-figure]")) return

      if (!pre.parentElement?.classList.contains("pre-wrapper")) {
        const wrapper = document.createElement("div")
        wrapper.className = "pre-wrapper"
        pre.parentElement?.insertBefore(wrapper, pre)
        wrapper.appendChild(pre)
        elements.push(wrapper)
      }

      const code = pre.querySelector("code") ?? pre
      addCopyButton(pre.parentElement!, code as HTMLElement, elements)
    })

    return () => {
      elements.forEach((el) => el.remove())
    }
  }, [])

  return null
}
