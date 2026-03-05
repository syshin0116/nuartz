import { visit } from "unist-util-visit"
import type { Root, Text } from "mdast"
import type { Plugin } from "unified"

const HIGHLIGHT_REGEX = /==([^=\n]+)==/g

export const remarkHighlight: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return
      const matches = [...node.value.matchAll(HIGHLIGHT_REGEX)]
      if (!matches.length) return

      const nodes: typeof parent.children = []
      let lastIndex = 0

      for (const match of matches) {
        const [full, content] = match
        const matchIndex = match.index!
        if (matchIndex > lastIndex) {
          nodes.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) })
        }
        nodes.push({ type: "html", value: `<mark>${content}</mark>` })
        lastIndex = matchIndex + full.length
      }
      if (lastIndex < node.value.length) {
        nodes.push({ type: "text", value: node.value.slice(lastIndex) })
      }
      parent.children.splice(index, 1, ...(nodes as any))
    })
  }
}
