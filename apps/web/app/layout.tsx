import type { Metadata } from "next"
import "./globals.css"
import "katex/dist/katex.min.css"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { NavSidebar } from "@/components/layout/nav-sidebar"
import { CommandPaletteDynamic } from "@/components/command-palette-dynamic"
import { getAllMarkdownFiles, buildFileTree, buildSearchIndex } from "nuartz"
import config from "@/nuartz.config"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export const metadata: Metadata = {
  title: config.site.title,
  description: config.site.description,
  verification: {
    google: "j5FT4jTGt4vceZ-Tgn0gf5q1VHp1VNTtBcbYC1VUBFE",
  },
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
              <aside className="hidden lg:block w-[var(--sidebar-width)] shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto">
                <div className="pl-6 pr-4 pt-4 pb-6">
                  <NavSidebar tree={tree} />
                </div>
              </aside>
              <main className="min-w-0 flex-1">
                {children}
              </main>
            </div>
          </div>
          <CommandPaletteDynamic entries={searchEntries} />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
