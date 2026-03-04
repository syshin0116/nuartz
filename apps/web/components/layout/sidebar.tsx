import Link from "next/link"
import { cn } from "@/lib/utils"

export interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
}

interface SidebarProps {
  tree: FileNode[]
  currentPath?: string
  className?: string
}

export function Sidebar({ tree, currentPath, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden w-[var(--sidebar-width)] shrink-0 border-r lg:block",
        className
      )}
    >
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 px-2">
        <nav>
          <FileTree nodes={tree} currentPath={currentPath} depth={0} />
        </nav>
      </div>
    </aside>
  )
}

function FileTree({
  nodes,
  currentPath,
  depth,
}: {
  nodes: FileNode[]
  currentPath?: string
  depth: number
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          currentPath={currentPath}
          depth={depth}
        />
      ))}
    </ul>
  )
}

function FileTreeNode({
  node,
  currentPath,
  depth,
}: {
  node: FileNode
  currentPath?: string
  depth: number
}) {
  const isActive = currentPath === node.path
  const indent = depth * 12

  if (node.type === "folder") {
    return (
      <li>
        <div
          className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-muted-foreground"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          <span className="text-xs">▾</span>
          <span className="font-medium">{node.name}</span>
        </div>
        {node.children && (
          <FileTree nodes={node.children} currentPath={currentPath} depth={depth + 1} />
        )}
      </li>
    )
  }

  return (
    <li>
      <Link
        href={`/${node.path}`}
        className={cn(
          "flex items-center rounded px-2 py-1 text-sm transition-colors hover:bg-muted",
          isActive
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        {node.name}
      </Link>
    </li>
  )
}
