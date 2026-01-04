export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Nuartz</h1>
      <p className="text-lg text-gray-600 mb-8">
        Next.js meets Quartz for Obsidian-compatible digital gardens with shadcn/ui
      </p>
      
      <div className="space-y-4">
        <section>
          <h2 className="text-2xl font-semibold mb-2">Features</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>All 27 Quartz plugins (13 transformers, 2 filters, 12 emitters)</li>
            <li>30+ Quartz components (Graph, Search, TOC, Backlinks, etc.)</li>
            <li>Full Obsidian compatibility (wikilinks, callouts, embeds, tags)</li>
            <li>Next.js 15 + App Router</li>
            <li>shadcn/ui components</li>
            <li>Auto-sync with upstream Quartz</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Usage</h2>
          <div className="space-y-2">
            <div>
              <h3 className="font-medium">1. As a standalone app:</h3>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                cd nuartz && bun run dev
              </code>
            </div>
            <div>
              <h3 className="font-medium">2. As an npm package:</h3>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                npm install nuartz
              </code>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
