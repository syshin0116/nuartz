import { visit } from "unist-util-visit"
import type { Root, Blockquote, Paragraph, Text } from "mdast"
import type { Plugin } from "unified"

// All supported callout types (Obsidian-compatible)
const CALLOUT_TYPES = new Set([
  "note", "abstract", "summary", "tldr",
  "info", "todo", "tip", "hint", "important",
  "success", "check", "done",
  "question", "help", "faq",
  "warning", "caution", "attention",
  "failure", "fail", "missing",
  "danger", "error", "bug",
  "example", "quote", "cite",
])

// [!type] or [!type]+ or [!type]- optionally followed by title
const CALLOUT_REGEX = /^\[!(\w+)\]([+-]?)([ \t].*)?$/i

export const remarkCallout: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0] as Paragraph | undefined
      if (firstChild?.type !== "paragraph") return

      const firstInline = firstChild.children[0] as Text | undefined
      if (firstInline?.type !== "text") return

      const firstLine = firstInline.value.split("\n")[0]
      const match = firstLine.match(CALLOUT_REGEX)
      if (!match) return

      const [, rawType, fold, titleText] = match
      const type = rawType.toLowerCase()
      if (!CALLOUT_TYPES.has(type)) return

      // Trim [!type] line from the paragraph
      const remainder = firstInline.value.slice(firstLine.length).trimStart()
      if (remainder) {
        firstInline.value = remainder
      } else {
        firstChild.children.shift()
      }

      const title = titleText?.trim() ?? type.charAt(0).toUpperCase() + type.slice(1)

      node.data = {
        ...node.data,
        hName: "div",
        hProperties: {
          className: `callout callout-${type}`,
          "data-callout": type,
          "data-callout-fold": fold || null,
          "data-callout-title": title,
        },
      }
    })
  }
}
