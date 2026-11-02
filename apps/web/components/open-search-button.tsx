"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OpenSearchButton() {
  return (
    <Button variant="outline" onClick={() => window.dispatchEvent(new Event("nuartz:search"))}>
      <Search className="mr-2 size-4" />Search notes
    </Button>
  )
}
