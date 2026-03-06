"use client"

import dynamic from "next/dynamic"
import type { SearchEntry } from "nuartz"

const CommandPalette = dynamic(
  () => import("@/components/command-palette").then((m) => m.CommandPalette),
  { ssr: false }
)

export function CommandPaletteDynamic({ entries }: { entries: SearchEntry[] }) {
  return <CommandPalette entries={entries} />
}
