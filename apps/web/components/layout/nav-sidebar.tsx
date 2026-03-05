"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileTreeNode } from "nuartz"

interface NavSidebarProps {
  tree: FileTreeNode[]
}

export function NavSidebar({ tree }: NavSidebarProps) {
  const pathname = usePathname()
  const currentSlug = pathname.replace(/^\//, "")

  return (
    <nav className="space-y-0.5 text-sm">
      <Link
        href="/"
        className={cn(
          "flex items-center rounded-md px-2 py-1.5 transition-colors hover:bg-muted",
          pathname === "/"
            ? "font-medium text-foreground bg-muted"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Home
      </Link>
      <div className="mt-2 space-y-0.5">
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
        {/* Section label style for folders */}
        <div
          className="flex w-full items-center gap-1 transition-colors"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center py-1.5 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-150",
                open && "rotate-90"
              )}
            />
          </button>
          <Link
            href={`/${node.path}`}
            className={cn(
              "flex-1 min-w-0 py-1.5 text-sm font-medium truncate",
              isAncestor
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {node.name}
          </Link>
        </div>

        {open && node.children && (
          <div style={{ paddingLeft: `${8 + indent + 12}px` }} className="space-y-0.5">
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
        "flex items-center rounded-md py-1.5 pr-2 transition-colors hover:bg-muted truncate",
        isActive
          ? "font-medium text-foreground bg-muted"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${8 + indent}px` }}
    >
      <span className="truncate">{node.name}</span>
    </Link>
  )
}
