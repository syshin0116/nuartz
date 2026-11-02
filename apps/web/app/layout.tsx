import type { Metadata } from "next"
import "./globals.css"
import "katex/dist/katex.min.css"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/header"
import { NavSidebar } from "@/components/layout/nav-sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CommandPaletteDynamic } from "@/components/command-palette-dynamic"
import { ContentLinkNavigation } from "@/components/content-link-navigation"
import config from "@/nuartz.config"
import fileTree from "@/.generated/file-tree.json"
import type { FileTreeNode } from "nuartz"

export const metadata: Metadata = {
  metadataBase: new URL(config.site.baseUrl),
  title: config.site.title,
  description: config.site.description,
  verification: config.site.verification,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Serialized tree: mtime is an ISO string here, which no consumer reads.
  const tree = fileTree as unknown as FileTreeNode[]
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={config.features.darkMode}
          forcedTheme={config.features.darkMode ? undefined : "light"}
          disableTransitionOnChange
        >
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:border">
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col">
            <Header tree={tree} title={config.site.title} links={config.nav?.links} search={config.features.search} darkMode={config.features.darkMode} />
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
          {config.features.search && <CommandPaletteDynamic />}
          <ContentLinkNavigation />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
