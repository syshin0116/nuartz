import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { NavSidebar } from "@/components/layout/nav-sidebar"
import { CommandPalette } from "@/components/command-palette"
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
            <div className="flex flex-1 mx-auto w-full max-w-[1440px]">
              <aside className="hidden lg:block w-[var(--sidebar-width)] shrink-0 bg-sidebar sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto">
                <div className="pl-6 pr-4 pt-4 pb-6">
                  <NavSidebar tree={tree} />
                </div>
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
