"use client"

import { BookOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ReaderModeToggle() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("reader-mode")
    if (stored === "true") {
      document.documentElement.classList.add("reader-mode")
      setActive(true)
    }
  }, [])

  const toggle = () => {
    const next = !active
    document.documentElement.classList.toggle("reader-mode", next)
    localStorage.setItem("reader-mode", String(next))
    setActive(next)
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      <BookOpen className="h-4 w-4" />
      <span className="sr-only">Toggle reader mode</span>
    </Button>
  )
}
