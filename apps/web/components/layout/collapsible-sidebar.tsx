"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavSidebar } from "./nav-sidebar"
import type { FileTreeNode } from "nuartz"

// Context so Header can access the toggle
interface SidebarContextValue {
  open: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({ open: true, toggle: () => {} })

export function useSidebar() {
  return useContext(SidebarContext)
}

export function SidebarProvider({ tree, children }: { tree: FileTreeNode[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  const toggle = useCallback(() => setOpen(o => !o), [])

  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

const OPEN_DURATION = 300
const CLOSE_DURATION = 200

export function SidebarLayout({ tree, children }: { tree: FileTreeNode[]; children: React.ReactNode }) {
  const { open } = useSidebar()
  const asideRef = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isInitial = useRef(true)

  useEffect(() => {
    const aside = asideRef.current
    const inner = innerRef.current
    if (!aside || !inner) return

    // Skip animation on first render
    if (isInitial.current) {
      isInitial.current = false
      aside.style.width = open ? `${inner.offsetWidth}px` : "0"
      aside.style.opacity = open ? "1" : "0"
      // Remove fixed width so it can respond to CSS var changes
      if (open) requestAnimationFrame(() => aside.style.removeProperty("width"))
      return
    }

    clearTimeout(timerRef.current)

    if (open) {
      // Measure target width, set it explicitly for CSS to transition to
      const targetWidth = inner.offsetWidth
      aside.style.width = `${targetWidth}px`
      aside.style.opacity = "1"
      aside.style.transitionDuration = `${OPEN_DURATION}ms`
      // After transition, remove inline width so layout can reflow naturally
      timerRef.current = setTimeout(() => {
        aside.style.removeProperty("width")
      }, OPEN_DURATION)
    } else {
      // Set current width explicitly first (so transition has a start value)
      aside.style.width = `${aside.offsetWidth}px`
      aside.style.transitionDuration = `${CLOSE_DURATION}ms`
      // Next frame: collapse to 0
      requestAnimationFrame(() => {
        aside.style.width = "0"
        aside.style.opacity = "0"
      })
    }
  }, [open])

  return (
    <div className="flex flex-1 mx-auto w-full max-w-[1440px]">
      <aside
        ref={asideRef}
        className="hidden lg:block shrink-0 border-r overflow-hidden transition-[width,opacity] ease-in-out"
        style={{ width: "var(--sidebar-width)" }}
      >
        <div ref={innerRef} className="w-[var(--sidebar-width)]">
          <ScrollArea className="sticky top-14 h-[calc(100vh-3.5rem)]">
            <div className="pl-6 pr-4 pt-4 pb-6">
              <NavSidebar tree={tree} />
            </div>
          </ScrollArea>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  )
}
