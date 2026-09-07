import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from "d3"
import type { GraphData, GraphNode } from "./graph"

export type PositionedNode = GraphNode & SimulationNodeDatum

export function layoutGraph(data: GraphData, currentSlug?: string, expanded = false): PositionedNode[] {
  const nodes: PositionedNode[] = data.nodes.map(node => ({ ...node }))
  const links = data.links.map(link => ({ ...link }))
  const simulation = forceSimulation(nodes)
    .force("link", forceLink<PositionedNode, typeof links[number]>(links).id(node => node.id).distance(expanded ? 110 : 72))
    .force("charge", forceManyBody().strength(expanded ? -320 : -160))
    .force("collision", forceCollide(expanded ? 36 : 24))
    .force("x", forceX(0).strength(0.06))
    .force("y", forceY(0).strength(0.06))
    .stop()
  const root = nodes.find(node => node.id === currentSlug)
  if (root) { root.fx = 0; root.fy = 0 }
  simulation.tick(120)
  return nodes
}
