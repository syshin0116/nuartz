"use client"

import { BookOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

export function ReaderModeToggle() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => {
      const enabled = localStorage.getItem("reader-mode") === "true"
      document.documentElement.classList.toggle("reader-mode", enabled)
      setActive(enabled)
    }
    sync()
    window.addEventListener("nuartz:reader-mode", sync)
    window.addEventListener("storage", sync)
    return () => { window.removeEventListener("nuartz:reader-mode", sync); window.removeEventListener("storage", sync) }
  }, [])

  const toggle = () => {
    const next = !active
    document.documentElement.classList.toggle("reader-mode", next)
    localStorage.setItem("reader-mode", String(next))
    setActive(next)
    window.dispatchEvent(new Event("nuartz:reader-mode"))
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={active ? "secondary" : "ghost"} size="icon" onClick={toggle} aria-pressed={active}>
          <BookOpen className="h-4 w-4" />
          <span className="sr-only">Toggle reader mode</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Reader mode</TooltipContent>
    </Tooltip>
  )
}
