"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileTreeNode } from "nuartz"

export function NavSidebar({ tree }: { tree: FileTreeNode[] }) {
  const pathname = usePathname()
  const currentSlug = decodeURIComponent(pathname.slice(1))
  return (
    <nav aria-label="Notes" className="space-y-1 text-sm">
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={cn("block rounded-md px-2 py-2 hover:bg-muted", pathname === "/" ? "bg-muted font-medium" : "text-muted-foreground")}>Home</Link>
      <Link href="/notes" aria-current={pathname === "/notes" ? "page" : undefined} className={cn("block rounded-md px-2 py-2 hover:bg-muted", pathname === "/notes" ? "bg-muted font-medium" : "text-muted-foreground")}>All notes</Link>
      <div className="pt-2">{tree.filter(node => node.path !== "index").map(node => <NavNode key={node.path} node={node} currentSlug={currentSlug} depth={0} />)}</div>
    </nav>
  )
}

function NavNode({ node, currentSlug, depth }: { node: FileTreeNode; currentSlug: string; depth: number }) {
  const isActive = node.type === "file" && currentSlug === node.path
  const isAncestor = node.type === "folder" && (currentSlug === node.path || currentSlug.startsWith(node.path + "/"))
  const [open, setOpen] = useState(isAncestor || depth === 0)
  const activeRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => { if (isAncestor) setOpen(true) }, [isAncestor])
  useEffect(() => { if (isActive) activeRef.current?.scrollIntoView({ block: "nearest" }) }, [isActive])
  if (node.type === "folder") return (
    <div>
      <div className="flex items-center gap-1">
        <button onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${node.name}`} className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        </button>
        <Link href={`/${node.path}`} className={cn("min-w-0 flex-1 truncate py-2 font-medium", isAncestor ? "text-foreground" : "text-muted-foreground")}>{node.name}</Link>
      </div>
      {open && <div className="ml-4 border-l pl-2">{node.children?.map(child => <NavNode key={child.path} node={child} currentSlug={currentSlug} depth={depth + 1} />)}</div>}
    </div>
  )
  return <Link ref={activeRef} href={`/${node.path}`} aria-current={isActive ? "page" : undefined} title={node.name} className={cn("block truncate rounded-md px-2 py-2 hover:bg-muted", isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>{node.name}</Link>
}
