import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { NavSidebar } from "@/components/layout/nav-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAllMarkdownFiles, buildFileTree, buildSearchIndex } from "nuartz"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export const metadata: Metadata = {
  title: "nuartz",
  description: "Personal knowledge base",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const tree = buildFileTree(files)
  const searchEntries = buildSearchIndex(files)

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header tree={tree} />
            <div className="flex flex-1">
              <aside className="hidden w-[var(--sidebar-width)] shrink-0 border-r lg:block">
                <ScrollArea className="sticky top-14 h-[calc(100vh-3.5rem)]">
                  <div className="p-4">
                    <NavSidebar tree={tree} />
                  </div>
                </ScrollArea>
              </aside>
              <main className="min-w-0 flex-1">
                {children}
              </main>
            </div>
          </div>
          <CommandPalette entries={searchEntries} />
        </ThemeProvider>
      </body>
    </html>
  )
}
