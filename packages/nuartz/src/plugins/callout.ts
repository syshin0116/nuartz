import { visit } from "unist-util-visit"
import type { Root, Blockquote, Paragraph, Text } from "mdast"
import type { Plugin } from "unified"

// [!type], [!type|metadata], then an optional fold marker (+ open, - closed) and title.
// Any type is accepted, as in Obsidian; unknown types use the default "note" style.
const CALLOUT_REGEX = /^\[!([\w-]+)(?:\|([^\]]*))?\]([+-]?)(?:[ \t]+(.*))?$/i

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

      const [, rawType, metadata, fold, titleText] = match
      const type = rawType.toLowerCase()

      // Trim [!type] line from the paragraph
      const remainder = firstInline.value.slice(firstLine.length).trimStart()
      if (remainder) {
        firstInline.value = remainder
      } else {
        firstChild.children.shift()
        // remarkBreaks runs before this plugin and converts the line break after
        // [!type] into a break node — remove any leading break nodes
        while (firstChild.children.length > 0 && firstChild.children[0].type === "break") {
          firstChild.children.shift()
        }
      }
      // If the first paragraph is now empty, remove it entirely
      if (firstChild.children.length === 0) {
        node.children.shift()
      }

      const title = titleText?.trim() || type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ")
      // Foldable callouts are <details>, so they toggle without JavaScript.
      const foldable = fold === "+" || fold === "-"

      const titleParagraph: Paragraph = {
        type: "paragraph",
        data: {
          hName: foldable ? "summary" : "div",
          hProperties: { className: ["callout-title"] },
        },
        children: [{ type: "text", value: title }],
      }

      node.children.unshift(titleParagraph)

      node.data = {
        ...node.data,
        hName: foldable ? "details" : "div",
        hProperties: {
          className: ["callout", `callout-${type}`],
          "data-callout": type,
          "data-callout-fold": fold || null,
          "data-callout-metadata": metadata?.trim() || null,
          open: fold === "+" ? true : undefined,
        },
      }
    })
  }
}
