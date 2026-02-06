import Link from "next/link"
import { Search } from "lucide-react"

interface HeaderProps {
  title?: string
}

export function Header({ title = "nuartz" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span>{title}</span>
        </Link>

        <div className="flex-1" />

        <button
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  )
}
