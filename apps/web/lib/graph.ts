export interface GraphNode {
  id: string
  title: string
  tags: string[]
  type?: "note" | "tag"
}

export interface GraphData {
  nodes: GraphNode[]
  links: { source: string; target: string }[]
}

export function getGraphNeighborhood(data: GraphData, root?: string, includeTags = true, depth = 2, maxNodes = 28): GraphData {
  const nodes = new Map(data.nodes.filter(node => includeTags || node.type !== "tag").map(node => [node.id, node]))
  const edges = new Map<string, GraphData["links"][number]>()
  for (const link of data.links) {
    if (link.source === link.target || !nodes.has(link.source) || !nodes.has(link.target)) continue
    const key = JSON.stringify([link.source, link.target].sort())
    edges.set(key, link)
  }
  const links = [...edges.values()]
  const visible = root ? new Set([root]) : new Set(nodes.keys())
  if (root) {
    const adjacent = new Map<string, Set<string>>()
    for (const link of links) {
      for (const [from, to] of [[link.source, link.target], [link.target, link.source]]) {
        if (!adjacent.has(from)) adjacent.set(from, new Set())
        adjacent.get(from)!.add(to)
      }
    }
    let frontier = [root]
    for (let hop = 0; hop < depth; hop++) {
      const next = [...new Set(frontier.flatMap(id => [...(adjacent.get(id) ?? [])]))]
        .filter(id => !visible.has(id))
        .sort((a, b) => (adjacent.get(b)?.size ?? 0) - (adjacent.get(a)?.size ?? 0) || a.localeCompare(b))
      // ponytail: cap the sidebar at 28 nodes; the expanded all-notes view is uncapped.
      frontier = next.slice(0, Math.max(0, maxNodes - visible.size))
      for (const id of frontier) visible.add(id)
    }
  }
  return {
    nodes: [...nodes.values()].filter(node => visible.has(node.id)).sort((a, b) => a.id.localeCompare(b.id)),
    links: links.filter(link => visible.has(link.source) && visible.has(link.target)),
  }
}

export function graphNodeHref(node: GraphNode): string {
  if (node.type === "tag") return `/tags/${encodeURIComponent(node.id.slice(4))}`
  return node.id === "index" ? "/" : `/${node.id.split("/").map(encodeURIComponent).join("/")}`
}

export function graphNeighbors(data: GraphData, id?: string): Set<string> {
  const neighbors = new Set<string>()
  for (const link of data.links) {
    if (link.source === id) neighbors.add(link.target)
    if (link.target === id) neighbors.add(link.source)
  }
  return neighbors
}
