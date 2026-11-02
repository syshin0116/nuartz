import { NextResponse, type NextRequest } from "next/server"

/**
 * Content negotiation for agents: a page request that prefers `text/markdown`
 * (as Claude Code and Cursor send) gets the note's portable Markdown from
 * /md/<slug>.md. Not available in static exports, which have no server.
 */
export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") ?? ""
  const markdownAt = accept.indexOf("text/markdown")
  const htmlAt = accept.indexOf("text/html")
  const response = markdownAt >= 0 && (htmlAt < 0 || markdownAt < htmlAt)
    ? NextResponse.rewrite(new URL(`/md/${request.nextUrl.pathname.replace(/^\/+|\/+$/g, "") || "index"}.md`, request.url))
    : NextResponse.next()
  response.headers.set("Vary", "Accept")
  return response
}

export const config = {
  // Pages only: skip Next internals, API routes, and files with an extension.
  matcher: ["/((?!_next/|api/|.*\\.[\\w]+$).*)"],
}
