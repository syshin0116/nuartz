import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar"
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
            <div className="flex flex-1">
              <CollapsibleSidebar tree={tree} />
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
