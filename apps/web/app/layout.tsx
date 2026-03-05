import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutShell } from "@/components/layout/layout-shell"
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
          <LayoutShell tree={tree}>{children}</LayoutShell>
          <CommandPalette entries={searchEntries} />
        </ThemeProvider>
      </body>
    </html>
  )
}
