import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { isHiddenContentPath } from "nuartz"

const CONTENT_DIR = path.join(process.cwd(), "content")

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".avif": "image/avif",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params
  const filePath = path.resolve(CONTENT_DIR, pathParts.join("/"))
  const relative = path.relative(CONTENT_DIR, filePath)
  // Media only: notes (including drafts) and hidden folders are never served raw.
  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()]
  if (!contentType || relative.startsWith("..") || path.isAbsolute(relative) || isHiddenContentPath(relative)) {
    return new NextResponse("Not found", { status: 404 })
  }
  try {
    const data = await fs.readFile(filePath)
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        // SVGs opened directly must not run scripts on this origin.
        "Content-Security-Policy": "sandbox",
      },
    })
  } catch {
    return new NextResponse("Not Found", { status: 404 })
  }
}
