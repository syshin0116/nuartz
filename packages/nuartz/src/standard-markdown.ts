import matter from "gray-matter"
import { WIKILINK_REGEX } from "./plugins/wikilink.js"
import { fileExtension } from "./plugins/media.js"

export interface StandardMarkdownOptions {
  /** Absolute URL for a note link target, or undefined to keep the link text only. */
  resolveLink: (target: string, heading?: string) => string | undefined
  /** Absolute URL for an attachment, or undefined when it does not exist. */
  resolveAsset: (target: string) => string | undefined
  /** Prepended as `# title` when given. */
  title?: string
  /** Prepended as a quote under the title when given. */
  description?: string
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/

/**
 * Converts an Obsidian note into portable CommonMark for readers outside the
 * site (LLMs, `.md` endpoints): drops frontmatter and `%%comments%%`, turns
 * wikilinks and embeds into ordinary links and images. Code is left as is.
 */
export function toStandardMarkdown(raw: string, options: StandardMarkdownOptions): string {
  const body = matter(raw).content
  const chunks: { code: boolean; text: string }[] = []
  let fence: string | undefined
  for (const line of body.split("\n")) {
    const marker = line.match(FENCE)?.[1]
    const code = fence !== undefined || marker !== undefined
    if (fence === undefined && marker) fence = marker[0]
    else if (fence !== undefined && marker?.[0] === fence) fence = undefined
    const last = chunks.at(-1)
    if (last && last.code === code) last.text += `\n${line}`
    else chunks.push({ code, text: line })
  }
  const converted = chunks.map(chunk => chunk.code ? chunk.text : convertProse(chunk.text, options)).join("\n")
  const header = [options.title && `# ${options.title}`, options.description && `> ${options.description}`].filter(Boolean).join("\n\n")
  return `${header ? `${header}\n\n` : ""}${converted.trim()}\n`
}

function convertProse(text: string, { resolveLink, resolveAsset }: StandardMarkdownOptions): string {
  // Odd segments are inline code spans.
  return text.replace(/%%[\s\S]*?%%/g, "").split(/(`+[^`]*`+)/).map((segment, i) => i % 2 ? segment : segment.replace(WIKILINK_REGEX, (_, bang: string, target: string, heading?: string, alias?: string) => {
    const extension = fileExtension(target)
    if (bang && extension && extension !== "md") {
      const url = resolveAsset(target)
      return url ? `![${/^\d+(x\d+)?$/.test(alias ?? "") ? target : alias ?? target}](${url})` : alias ?? target
    }
    const text = alias ?? (heading ? `${target} > ${heading.replace(/^\^/, "")}` : target)
    const url = resolveLink(target, heading)
    return url ? `[${text}](${url})` : text
  })).join("")
}
