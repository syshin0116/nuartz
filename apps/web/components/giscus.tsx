"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export function GiscusComments() {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID

  if (!repo || !repoId || !category || !categoryId) return null

  return <GiscusWidget repo={repo} repoId={repoId} category={category} categoryId={categoryId} />
}

function GiscusWidget({
  repo,
  repoId,
  category,
  categoryId,
}: {
  repo: string
  repoId: string
  category: string
  categoryId: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  const giscusTheme = resolvedTheme === "dark" ? "dark" : "light"

  useEffect(() => {
    if (!ref.current) return

    const existing = ref.current.querySelector("script")
    if (existing) existing.remove()

    const script = document.createElement("script")
    script.src = "https://giscus.app/client.js"
    script.setAttribute("data-repo", repo)
    script.setAttribute("data-repo-id", repoId)
    script.setAttribute("data-category", category)
    script.setAttribute("data-category-id", categoryId)
    script.setAttribute("data-mapping", "pathname")
    script.setAttribute("data-strict", "0")
    script.setAttribute("data-reactions-enabled", "1")
    script.setAttribute("data-emit-metadata", "0")
    script.setAttribute("data-input-position", "top")
    script.setAttribute("data-theme", giscusTheme)
    script.setAttribute("data-lang", "en")
    script.crossOrigin = "anonymous"
    script.async = true

    ref.current.appendChild(script)
  }, [repo, repoId, category, categoryId, giscusTheme])

  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame")
    if (iframe) {
      iframe.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: giscusTheme } } },
        "https://giscus.app"
      )
    }
  }, [giscusTheme])

  return <div ref={ref} className="mt-8" />
}
