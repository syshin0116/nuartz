import { visit } from "unist-util-visit"
import type { Root } from "mdast"
import type { Plugin } from "unified"

/** Replaces ```base code blocks with the HTML returned by `render`; blocks it returns undefined for stay code. */
export const remarkBaseBlock: Plugin<[{ render: (source: string) => string | undefined }], Root> = ({ render }) => tree => {
  visit(tree, "code", (node, index, parent) => {
    if (node.lang !== "base" || !parent || index === undefined) return
    const html = render(node.value)
    if (html !== undefined) parent.children[index] = { type: "html", value: html }
  })
}
