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
  const currentSlug = pathname.replace(/^\//, "")

  return (
    <nav className="space-y-0.5">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
          pathname === "/"
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Home className="h-3.5 w-3.5 shrink-0" />
        Home
      </Link>
      <div className="mt-1 space-y-0.5">
        {tree.map((node) => (
          <NavNode key={node.path} node={node} currentSlug={currentSlug} depth={0} />
        ))}
      </div>
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
  const isAncestor = node.type === "folder" && currentSlug.startsWith(node.path + "/")
  const [open, setOpen] = useState(isAncestor || depth === 0)
  const indent = depth * 12

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="flex w-full items-center rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {/* Toggle arrow */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 py-1.5 pr-1 shrink-0"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
                open && "rotate-90"
              )}
            />
          </button>
          {/* Folder name links to folder index page */}
          <Link
            href={`/${node.path}`}
            className={cn(
              "flex flex-1 items-center gap-1.5 py-1.5 pr-2 min-w-0",
              isAncestor && "text-foreground"
            )}
          >
            <Folder className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate font-medium">{node.name}</span>
          </Link>
        </div>
        {open && node.children && (
          <div className={cn("border-l border-border/50 ml-[19px]", depth > 0 && "ml-[19px]")} style={{ marginLeft: `${8 + indent + 8}px` }}>
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
        "flex items-center gap-1.5 rounded-md py-1.5 text-sm transition-colors hover:bg-muted",
        isActive
          ? "bg-muted/80 font-medium text-foreground border-l-2 border-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${isActive ? 6 + indent : 8 + indent}px` }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 opacity-50" />
      <span className="truncate">{node.name}</span>
    </Link>
  )
}
