import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

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
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params
  const joined = pathParts.join("/")
  const normalized = path.normalize(joined)
  if (normalized.startsWith("..")) {
    return new NextResponse("Forbidden", { status: 403 })
  }
  const filePath = path.join(CONTENT_DIR, normalized)
  if (!filePath.startsWith(CONTENT_DIR + path.sep) && filePath !== CONTENT_DIR) {
    return new NextResponse("Forbidden", { status: 403 })
  }
  try {
    const data = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream"
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return new NextResponse("Not Found", { status: 404 })
  }
}
