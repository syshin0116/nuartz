"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { NavSidebar } from "./nav-sidebar"
import type { FileTreeNode } from "nuartz"

interface MobileNavProps {
  tree: FileTreeNode[]
}

export function MobileNav({ tree }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <NavSidebar tree={tree} />
      </SheetContent>
    </Sheet>
  )
}
