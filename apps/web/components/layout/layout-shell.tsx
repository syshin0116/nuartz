"use client"

import { useState } from "react"
import { Header } from "./header"
import { CollapsibleSidebar } from "./collapsible-sidebar"
import type { FileTreeNode } from "nuartz"

export function LayoutShell({
  tree,
  children,
}: {
  tree: FileTreeNode[]
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        tree={tree}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
      <div className="flex flex-1">
        <CollapsibleSidebar tree={tree} open={sidebarOpen} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
