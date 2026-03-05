import { visit } from "unist-util-visit"
import type { Root, Text } from "mdast"
import type { Plugin } from "unified"

// matches %%...%% including across newlines within a paragraph node
const COMMENT_REGEX = /%%[\s\S]*?%%/g

export const remarkObsidianComment: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return
      if (!node.value.includes("%%")) return

      const matches = [...node.value.matchAll(COMMENT_REGEX)]
      if (!matches.length) return

      const nodes: typeof parent.children = []
      let lastIndex = 0

      for (const match of matches) {
        const [full] = match
        const matchIndex = match.index!
        if (matchIndex > lastIndex) {
          nodes.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) })
        }
        // strip the comment - push nothing
        lastIndex = matchIndex + full.length
      }
      if (lastIndex < node.value.length) {
        nodes.push({ type: "text", value: node.value.slice(lastIndex) })
      }
      parent.children.splice(index, 1, ...(nodes as any))
    })
  }
}
