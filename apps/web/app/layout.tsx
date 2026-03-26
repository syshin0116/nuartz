import type { Metadata } from "next"
import "./globals.css"
import "katex/dist/katex.min.css"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { NavSidebar } from "@/components/layout/nav-sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CommandPaletteDynamic } from "@/components/command-palette-dynamic"
import { getAllMarkdownFiles, buildFileTree } from "nuartz"
import { unstable_cache } from "next/cache"
import config from "@/nuartz.config"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")

const getCachedLayoutData = unstable_cache(
  async () => {
    const files = await getAllMarkdownFiles(CONTENT_DIR)
    return { tree: buildFileTree(files) }
  },
  ["layout-data"],
  { revalidate: false }
)

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
  const { tree } = await getCachedLayoutData()
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:border">
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col">
            <Header tree={tree} />
            <div className="flex flex-1 mx-auto w-full max-w-[1440px]">
              <aside className="hidden lg:block w-[var(--sidebar-width)] shrink-0 border-r">
                <ScrollArea className="sticky top-14 h-[calc(100vh-3.5rem)] scroll-mask">
                  <div className="pl-6 pr-4 pt-4 pb-6">
                    <NavSidebar tree={tree} />
                  </div>
                </ScrollArea>
              </aside>
              <main id="main-content" className="min-w-0 flex-1">
                {children}
              </main>
            </div>
          </div>
          <CommandPaletteDynamic />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
