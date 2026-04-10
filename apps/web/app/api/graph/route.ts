import { NextResponse } from "next/server"
import graphData from "@/.generated/graph.json"

export const dynamic = "force-static"

export interface GraphNode {
  id: string
  title: string
  tags: string[]
  type: "note" | "tag"
}

export interface GraphLink {
  source: string
  target: string
}

export async function GET() {
  return NextResponse.json(graphData)
}
