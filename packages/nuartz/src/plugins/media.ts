import type { PhrasingContent } from "mdast"

export type MediaKind = "image" | "video" | "audio" | "pdf"

const MEDIA_EXTENSIONS: Record<string, MediaKind> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image", avif: "image", bmp: "image",
  mp4: "video", webm: "video", mov: "video", ogv: "video", mkv: "video",
  mp3: "audio", wav: "audio", m4a: "audio", ogg: "audio", flac: "audio", "3gp": "audio",
  pdf: "pdf",
}

export function fileExtension(target: string): string | undefined {
  return target.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase()
}

export function mediaKind(target: string): MediaKind | undefined {
  const ext = fileExtension(target)
  return ext ? MEDIA_EXTENSIONS[ext] : undefined
}

/** Obsidian size syntax after `|`: "300" (width) or "300x200". */
export function parseSize(text: string | undefined): { width: string; height?: string } | undefined {
  const match = text?.trim().match(/^(\d+)(?:x(\d+))?$/)
  return match ? { width: match[1], ...(match[2] && { height: match[2] }) } : undefined
}

/** Splits `alt|300x200` into display text and size, as Obsidian does for image alt text. */
export function splitAltSize(alt: string): { alt: string; size?: { width: string; height?: string } } {
  const at = alt.lastIndexOf("|")
  const size = at >= 0 ? parseSize(alt.slice(at + 1)) : parseSize(alt)
  if (!size) return { alt }
  return { alt: at >= 0 ? alt.slice(0, at).trim() : "", size }
}

const YOUTUBE = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&#]t=(\d+))?/

export function youtubeEmbedUrl(url: string): string | undefined {
  const match = url.match(YOUTUBE)
  return match ? `https://www.youtube.com/embed/${match[1]}${match[2] ? `?start=${match[2]}` : ""}` : undefined
}

type Size = { width: string; height?: string } | undefined

const element = (hName: string, hProperties: Record<string, unknown>): PhrasingContent =>
  // mdast-util-to-hast turns unknown nodes with hName into that element.
  ({ type: "mediaEmbed", data: { hName, hProperties, hChildren: [] } }) as unknown as PhrasingContent

/** mdast node for an embedded attachment, rendered as <img>, <video>, <audio> or <iframe>. */
export function mediaNode(kind: MediaKind, url: string, { alt = "", size, source }: { alt?: string; size?: Size; source: string }): PhrasingContent {
  const dimensions = { width: size?.width, height: size?.height }
  switch (kind) {
    case "image":
      return { type: "image", url, alt, data: { hProperties: { className: ["embed-image"], "data-embed": source, ...dimensions, loading: "lazy" } } }
    case "video":
      return element("video", { src: url, controls: true, preload: "metadata", className: ["embed-video"], "data-embed": source, ...dimensions })
    case "audio":
      return element("audio", { src: url, controls: true, preload: "metadata", className: ["embed-audio"], "data-embed": source })
    case "pdf":
      return element("iframe", { src: url, title: alt || source, className: ["embed-pdf"], "data-embed": source, loading: "lazy", ...dimensions })
  }
}

export function youtubeNode(embedUrl: string, { alt, size, source }: { alt?: string; size?: Size; source: string }): PhrasingContent {
  return element("iframe", {
    src: embedUrl, title: alt || "YouTube video", className: ["embed-youtube"], "data-embed": source, loading: "lazy",
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    referrerPolicy: "strict-origin-when-cross-origin", allowFullScreen: true, width: size?.width, height: size?.height,
  })
}
