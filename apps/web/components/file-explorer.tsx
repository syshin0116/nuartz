"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, FileText, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileNode } from "./layout/sidebar"

interface FileExplorerProps {
  nodes: FileNode[]
  currentPath?: string
}

export function FileExplorer({ nodes, currentPath }: FileExplorerProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <ExplorerNode key={node.path} node={node} currentPath={currentPath} depth={0} />
      ))}
    </div>
  )
}

function ExplorerNode({
  node,
  currentPath,
  depth,
}: {
  node: FileNode
  currentPath?: string
  depth: number
}) {
  const [open, setOpen] = useState(
    // Auto-expand folders that contain the current path
    node.type === "folder" && currentPath?.startsWith(node.path + "/")
  )

  const indent = depth * 16

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")}
          />
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child) => (
              <ExplorerNode
                key={child.path}
                node={child}
                currentPath={currentPath}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isActive = currentPath === node.path

  return (
    <Link
      href={`/${node.path}`}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${8 + indent}px` }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
      <span className="truncate">{node.name}</span>
    </Link>
  )
}
