import { visit } from "unist-util-visit"
import type { Root, Text } from "mdast"
import type { Plugin } from "unified"

export const remarkArrows: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text) => {
      node.value = node.value
        .replace(/<-->/g, "↔")
        .replace(/-->/g, "→")
        .replace(/<--/g, "←")
    })
  }
}
