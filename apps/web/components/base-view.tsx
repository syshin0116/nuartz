"use client"

import { useId, useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { Info } from "lucide-react"
import type { BaseCell, BaseResult, BaseRow, BaseViewResult } from "nuartz"
import { cn } from "@/lib/utils"

const notePath = (slug: string) => `/${slug.split("/").map(encodeURIComponent).join("/")}`

function Cell({ cell }: { cell: BaseCell | undefined }) {
  if (cell === null || cell === undefined) return null
  if (Array.isArray(cell)) return cell.map((item, index) => <span key={index}>{index > 0 && ", "}<Cell cell={item} /></span>)
  if (typeof cell === "object") return cell.slug ? <Link href={notePath(cell.slug)} className="underline underline-offset-4 hover:text-foreground">{cell.text}</Link> : cell.text
  if (typeof cell === "boolean") return cell ? "Yes" : "No"
  return String(cell)
}

function Notices({ notices }: { notices: string[] }) {
  if (!notices.length) return null
  return (
    <ul className="mb-4 space-y-1 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
      {notices.map(notice => <li key={notice} className="flex gap-1.5"><Info className="mt-0.5 size-3 shrink-0" />{notice}</li>)}
    </ul>
  )
}

function RowTitle({ row }: { row: BaseRow }) {
  return <Link href={notePath(row.slug)} className="font-medium underline-offset-4 hover:underline">{row.title}</Link>
}

function ViewBody({ view }: { view: BaseViewResult }) {
  if (!view.count) return <p className="py-8 text-center text-sm text-muted-foreground">No matching notes.</p>
  const details = view.columns.filter(column => column.id !== "file.name")
  const groupLabel = (label: string | null) => view.grouped && <h3 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground first:mt-0">{label ?? "(empty)"}</h3>

  if (view.type === "table") return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>{view.columns.map(column => <th key={column.id} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">{column.label}</th>)}</tr>
        </thead>
        {view.groups.map((group, index) => (
          <tbody key={group.label ?? `group-${index}`} className="divide-y border-t">
            {view.grouped && <tr><th colSpan={view.columns.length} scope="colgroup" className="bg-muted/20 px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground">{group.label ?? "(empty)"}</th></tr>}
            {group.rows.map(row => (
              <tr key={row.slug} className="hover:bg-muted/40">
                {view.columns.map(column => <td key={column.id} className="px-3 py-2 align-top"><Cell cell={row.cells[column.id]} /></td>)}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )

  if (view.type === "cards") return view.groups.map((group, index) => (
    <section key={group.label ?? `group-${index}`}>
      {groupLabel(group.label)}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.rows.map(row => (
          <div key={row.slug} className="rounded-lg border p-4">
            <RowTitle row={row} />
            {details.length > 0 && (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {details.map(column => [
                  <dt key={`${column.id}-label`} className="text-muted-foreground">{column.label}</dt>,
                  <dd key={column.id} className="min-w-0 break-words"><Cell cell={row.cells[column.id]} /></dd>,
                ])}
              </dl>
            )}
          </div>
        ))}
      </div>
    </section>
  ))

  return view.groups.map((group, index) => (
    <section key={group.label ?? `group-${index}`}>
      {groupLabel(group.label)}
      <ul className="divide-y rounded-lg border">
        {group.rows.map(row => (
          <li key={row.slug} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2 text-sm">
            <RowTitle row={row} />
            {details.map(column => row.cells[column.id] !== null && <span key={column.id} className="text-muted-foreground"><Cell cell={row.cells[column.id]} /></span>)}
          </li>
        ))}
      </ul>
    </section>
  ))
}

export function BaseView({ base }: { base: BaseResult }) {
  const id = useId()
  const [active, setActive] = useState(0)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])
  const view = base.views[active] ?? base.views[0]
  if (!view) return null

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = base.views.length - 1
    const next = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }[event.key]
    if (next === undefined) return
    event.preventDefault()
    setActive(next)
    tabsRef.current[next]?.focus()
  }

  return (
    <div>
      <Notices notices={base.notices} />
      {base.views.length > 1 && (
        <div role="tablist" aria-label="Views" className="mb-4 flex flex-wrap gap-1 border-b" onKeyDown={onKeyDown}>
          {base.views.map((item, index) => (
            <button
              key={index}
              ref={element => { tabsRef.current[index] = element }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={index === active}
              aria-controls={`${id}-panel`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn("-mb-px border-b-2 px-3 py-2 text-sm transition-colors", index === active ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      <div id={`${id}-panel`} role={base.views.length > 1 ? "tabpanel" : undefined} aria-labelledby={base.views.length > 1 ? `${id}-tab-${active}` : undefined}>
        <p className="mb-3 text-xs text-muted-foreground">{view.count} {view.count === 1 ? "note" : "notes"}</p>
        <Notices notices={view.notices} />
        <ViewBody view={view} />
      </div>
    </div>
  )
}
