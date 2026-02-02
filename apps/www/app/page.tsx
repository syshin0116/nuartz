import Link from "next/link"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">nuartz</h1>
      <p className="text-lg text-muted-foreground text-center max-w-md">
        Obsidian-compatible digital garden built on Next.js + shadcn/ui
      </p>
      <div className="flex gap-3 mt-4">
        <Link
          href="/notes"
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background hover:opacity-90 transition-opacity"
        >
          Browse notes
        </Link>
        <a
          href="https://github.com/syshin0116/nuartz"
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </main>
  )
}
