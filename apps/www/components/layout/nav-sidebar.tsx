"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, FileText, Folder, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileTreeNode } from "nuartz"

interface NavSidebarProps {
  tree: FileTreeNode[]
}

export function NavSidebar({ tree }: NavSidebarProps) {
  const pathname = usePathname()
  // Strip leading slash for comparison
  const currentSlug = pathname.replace(/^\//, "")

  return (
    <nav className="space-y-0.5">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
          pathname === "/" ? "bg-muted font-medium" : "text-muted-foreground"
        )}
      >
        <Home className="h-3.5 w-3.5 shrink-0" />
        Home
      </Link>
      {tree.map((node) => (
        <NavNode key={node.path} node={node} currentSlug={currentSlug} depth={0} />
      ))}
    </nav>
  )
}

function NavNode({
  node,
  currentSlug,
  depth,
}: {
  node: FileTreeNode
  currentSlug: string
  depth: number
}) {
  const isActive = node.type === "file" && currentSlug === node.path
  const isAncestor =
    node.type === "folder" && currentSlug.startsWith(node.path + "/")

  const [open, setOpen] = useState(isAncestor || depth === 0)
  const indent = depth * 14

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
              open && "rotate-90"
            )}
          />
          <Folder className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child) => (
              <NavNode
                key={child.path}
                node={child}
                currentSlug={currentSlug}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={`/${node.path}`}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${8 + indent}px` }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 opacity-50" />
      <span className="truncate">{node.name}</span>
    </Link>
  )
}
