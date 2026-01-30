import { visit } from "unist-util-visit"
import type { Root, Text, PhrasingContent } from "mdast"
import type { Plugin } from "unified"

// #tag — must start with letter, can contain letters, digits, -, _
const TAG_REGEX = /#([a-zA-Z][a-zA-Z0-9_-]*)/g

export interface TagPluginResult {
  tags: string[]
}

/**
 * Transforms inline #tags into links.
 * Collected tags are stored on the vfile data: `file.data.tags`
 */
export const remarkTag: Plugin<[], Root> = () => {
  return (tree, file) => {
    const collected: string[] = []

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return

      const matches = [...node.value.matchAll(TAG_REGEX)]
      if (!matches.length) return

      const nodes: PhrasingContent[] = []
      let lastIndex = 0

      for (const match of matches) {
        const [full, tag] = match
        const matchIndex = match.index!

        if (matchIndex > lastIndex) {
          nodes.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) })
        }

        collected.push(tag)
        nodes.push({
          type: "link",
          url: `/tags/${tag}`,
          data: { hProperties: { className: "tag", "data-tag": tag } },
          children: [{ type: "text", value: `#${tag}` }],
        })

        lastIndex = matchIndex + full.length
      }

      if (lastIndex < node.value.length) {
        nodes.push({ type: "text", value: node.value.slice(lastIndex) })
      }

      parent.children.splice(index, 1, ...nodes)
    })

    const existing = (file.data.tags as string[] | undefined) ?? []
    file.data.tags = [...new Set([...existing, ...collected])]
  }
}
