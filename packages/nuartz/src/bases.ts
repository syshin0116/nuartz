/**
 * Static evaluation of Obsidian Bases (`.base` files and ```base blocks) over
 * published notes. See https://help.obsidian.md/bases/syntax.
 */
import path from "node:path"
import matter from "gray-matter"
import { normalizeNotePath } from "./links.js"
import { BaseUnsupportedError, parseBaseExpression, type BaseExpression } from "./bases-expression.js"

export { BaseUnsupportedError, parseBaseExpression, type BaseExpression } from "./bases-expression.js"

export type BaseFilter = string | { and: BaseFilter[] } | { or: BaseFilter[] } | { not: BaseFilter[] }
export type BaseViewType = "table" | "cards" | "list"

export interface BaseSort { property: string; direction: "ASC" | "DESC" }

export interface BaseViewDefinition {
  /** Rendered type; views of other types (kanban, map, ...) fall back to "table". */
  type: BaseViewType
  name: string
  filters?: BaseFilter
  /** Property ids such as `file.name`, `note.status`, `formula.total`. */
  order: string[]
  sort: BaseSort[]
  limit?: number
  groupBy?: BaseSort
  notices: string[]
}

export interface BaseDefinition {
  filters?: BaseFilter
  formulas: Record<string, string>
  properties: Record<string, { displayName?: string }>
  views: BaseViewDefinition[]
  notices: string[]
}

/** A published note as Bases sees it. */
export interface BaseFile {
  /** Path relative to the content root, with extension (e.g. "projects/alpha.md"). */
  path: string
  slug: string
  properties: Record<string, unknown>
  /** Frontmatter and inline tags, without "#". */
  tags: string[]
  /** Slugs of notes this note links to. */
  links: string[]
  mtime?: Date
  ctime?: Date
  size?: number
}

/** A serializable cell value. Objects with `text` are links when `slug` is set. */
export type BaseCell = null | string | number | boolean | { text: string; slug?: string } | BaseCell[]

export interface BaseRow { slug: string; title: string; cells: Record<string, BaseCell> }
export interface BaseGroup { label: string | null; rows: BaseRow[] }

export interface BaseViewResult {
  name: string
  type: BaseViewType
  columns: { id: string; label: string }[]
  /** One group with a null label when the view has no groupBy. */
  groups: BaseGroup[]
  grouped: boolean
  count: number
  notices: string[]
}

export interface BaseResult { views: BaseViewResult[]; notices: string[] }

export interface EvaluateBaseOptions {
  /** Resolves a link target (e.g. from `[[Note]]` or `link("Note")`) to a note slug. */
  resolveNote?: (target: string) => string | undefined
  /** The file `this` refers to: the base itself, or the note embedding it. */
  thisFile?: BaseFile
  /** Time used by now() and today(); defaults to the build time. */
  now?: Date
}

const VIEW_TYPES = new Set(["table", "cards", "list"])
const IGNORED_VIEW_KEYS = new Set(["type", "name", "filters", "order", "sort", "limit", "groupBy", "image", "imageFit", "imageAspectRatio", "cardSize", "rowHeight", "columnSize", "markers", "indentProperties", "separator"])
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)

/** `status` and `note.status` name the same column; `file.*`, `formula.*`, and `this.*` keep their namespace. */
export function normalizePropertyId(id: string): string {
  const trimmed = id.trim()
  return /^(note|file|formula|this)\./.test(trimmed) ? trimmed : `note.${trimmed}`
}

function parseFilter(value: unknown, notices: string[]): BaseFilter | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  if (isRecord(value)) {
    for (const key of ["and", "or", "not"] as const) {
      if (key in value) {
        const items = Array.isArray(value[key]) ? value[key] : [value[key]]
        return { [key]: items.map(item => parseFilter(item, notices)).filter((item): item is BaseFilter => item !== undefined) } as BaseFilter
      }
    }
  }
  notices.push(`Unsupported filter: ${JSON.stringify(value)}`)
  return undefined
}

const parseSort = (value: unknown): BaseSort | undefined => {
  if (typeof value === "string") return { property: normalizePropertyId(value), direction: "ASC" }
  if (!isRecord(value) || typeof value.property !== "string") return undefined
  return { property: normalizePropertyId(value.property), direction: String(value.direction).toUpperCase() === "DESC" ? "DESC" : "ASC" }
}

/** Parses `.base` YAML. Never throws: problems become notices on the result. */
export function parseBase(source: string): BaseDefinition {
  const notices: string[] = []
  let data: unknown = {}
  try {
    // gray-matter's YAML engine avoids a second YAML dependency.
    data = source.trim() ? matter(`---\n${source}\n---\n`, {}).data : {}
  } catch (error) {
    notices.push(`Invalid YAML: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`)
  }
  if (!isRecord(data)) data = {}
  const root = data as Record<string, unknown>

  const formulas: Record<string, string> = {}
  if (isRecord(root.formulas)) for (const [name, value] of Object.entries(root.formulas)) formulas[name] = String(value)

  const properties: Record<string, { displayName?: string }> = {}
  if (isRecord(root.properties)) {
    for (const [id, value] of Object.entries(root.properties)) {
      if (isRecord(value) && value.displayName !== undefined) properties[normalizePropertyId(id)] = { displayName: String(value.displayName) }
    }
  }
  if (root.summaries !== undefined) notices.push("Summaries are not supported")

  const rawViews = Array.isArray(root.views) && root.views.length ? root.views : [{ type: "table", name: "Table" }]
  const views = rawViews.filter(isRecord).map((view, index): BaseViewDefinition => {
    const viewNotices: string[] = []
    const requested = typeof view.type === "string" ? view.type : "table"
    if (!VIEW_TYPES.has(requested)) viewNotices.push(`View type "${requested}" is shown as a table`)
    for (const key of Object.keys(view)) {
      if (key === "summaries") viewNotices.push("Summaries are not supported")
      else if (key === "groupOrder") viewNotices.push("groupOrder is not supported; groups follow groupBy.direction")
      else if (!IGNORED_VIEW_KEYS.has(key)) viewNotices.push(`View option "${key}" is ignored`)
    }
    const limit = Number(view.limit)
    const order = Array.isArray(view.order) ? view.order.filter((id): id is string => typeof id === "string").map(normalizePropertyId) : []
    return {
      type: VIEW_TYPES.has(requested) ? requested as BaseViewType : "table",
      name: typeof view.name === "string" && view.name ? view.name : `View ${index + 1}`,
      filters: parseFilter(view.filters, viewNotices),
      order: order.length ? order : ["file.name"],
      sort: (Array.isArray(view.sort) ? view.sort : view.sort ? [view.sort] : []).map(parseSort).filter((sort): sort is BaseSort => sort !== undefined),
      limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
      groupBy: parseSort(view.groupBy),
      notices: viewNotices,
    }
  })
  return { filters: parseFilter(root.filters, notices), formulas, properties, views, notices }
}

// Runtime values. Plain JS values plus tagged objects for files, links, and durations.
type FileValue = { kind: "file"; file: BaseFile }
type LinkValue = { kind: "link"; target: string; display?: string }
type DurationValue = { kind: "duration"; ms: number }
type Value = null | string | number | boolean | Date | Value[] | FileValue | LinkValue | DurationValue | { [key: string]: unknown }

const isTagged = <K extends string>(value: unknown, kind: K): value is { kind: K } => isRecord(value) && value.kind === kind
const isFile = (value: unknown): value is FileValue => isTagged(value, "file") && "file" in (value as object)
const isLink = (value: unknown): value is LinkValue => isTagged(value, "link") && typeof (value as LinkValue).target === "string"
const isDuration = (value: unknown): value is DurationValue => isTagged(value, "duration") && typeof (value as DurationValue).ms === "number"

const WIKILINK = /^\[\[([^\]|#]*)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]$/

const fileName = (file: BaseFile) => path.posix.basename(file.path)
const fileBasename = (file: BaseFile) => fileName(file).replace(/\.[^.]+$/, "")
const fileFolder = (file: BaseFile) => path.posix.dirname(file.path) === "." ? "/" : path.posix.dirname(file.path)

const DURATION_UNITS: Record<string, number> = {
  s: 1000, second: 1000, seconds: 1000, m: 60_000, minute: 60_000, minutes: 60_000, h: 3_600_000, hour: 3_600_000, hours: 3_600_000,
  d: 86_400_000, day: 86_400_000, days: 86_400_000, w: 604_800_000, week: 604_800_000, weeks: 604_800_000,
  M: 2_592_000_000, month: 2_592_000_000, months: 2_592_000_000, y: 31_536_000_000, year: 31_536_000_000, years: 31_536_000_000,
}

/** Parses "1d", "2 weeks", "-3h" into milliseconds; months and years use 30 and 365 days. */
function parseDuration(value: string): number | undefined {
  const parts = [...value.trim().matchAll(/(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)/g)]
  if (!parts.length || parts.map(part => part[0]).join("").replace(/\s/g, "") !== value.replace(/\s/g, "")) return undefined
  let ms = 0
  for (const [, amount, unit] of parts) {
    const size = DURATION_UNITS[unit] ?? DURATION_UNITS[unit.toLowerCase()]
    if (size === undefined) return undefined
    ms += Number(amount) * size
  }
  return ms
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value.replace(" ", "T"))
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  return undefined
}

const pad = (value: number, length = 2) => String(value).padStart(length, "0")

/** Subset of Moment.js tokens: YYYY YY MM M DD D HH H mm ss. Dates are formatted in UTC for reproducible builds. */
function formatDate(date: Date, format: string): string {
  const tokens: Record<string, string> = {
    YYYY: String(date.getUTCFullYear()), YY: pad(date.getUTCFullYear() % 100), MM: pad(date.getUTCMonth() + 1), M: String(date.getUTCMonth() + 1),
    DD: pad(date.getUTCDate()), D: String(date.getUTCDate()), HH: pad(date.getUTCHours()), H: String(date.getUTCHours()),
    mm: pad(date.getUTCMinutes()), ss: pad(date.getUTCSeconds()),
  }
  return format.replace(/\[([^\]]*)\]|YYYY|YY|MM|M|DD|D|HH|H|mm|ss/g, (match, literal: string | undefined) => literal ?? tokens[match])
}

const displayDate = (date: Date) => formatDate(date, date.getUTCHours() || date.getUTCMinutes() || date.getUTCSeconds() ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD")

function toText(value: Value | undefined): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return displayDate(value)
  if (Array.isArray(value)) return value.map(toText).join(", ")
  if (isFile(value)) return fileBasename(value.file)
  if (isLink(value)) return value.display ?? path.posix.basename(value.target)
  if (isDuration(value)) return `${Math.round(value.ms / 86_400_000)}d`
  if (isRecord(value)) return JSON.stringify(value)
  return String(value)
}

const truthy = (value: Value | undefined) => Array.isArray(value) ? value.length > 0 : Boolean(value) && !(typeof value === "number" && Number.isNaN(value))

/** Link target of a file, link, or `[[wikilink]]`/plain string, normalized for comparison. */
function linkTarget(value: Value | undefined): string | undefined {
  if (isFile(value)) return value.file.slug
  if (isLink(value)) return value.target
  if (typeof value === "string") return WIKILINK.exec(value.trim())?.[1] ?? value
  return undefined
}

function sameTarget(a: string, b: string, resolve: (target: string) => string | undefined) {
  const slugA = resolve(a) ?? normalizeNotePath(a)
  const slugB = resolve(b) ?? normalizeNotePath(b)
  return slugA === slugB || path.posix.basename(slugA) === slugB || slugA === path.posix.basename(slugB)
}

const isEmptyValue = (value: Value | undefined) =>
  value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0) || (isRecord(value) && !value.kind && Object.keys(value).length === 0)

interface Scope { file: BaseFile; locals: Record<string, Value> }

class Evaluator {
  private readonly parsed = new Map<string, BaseExpression | BaseUnsupportedError>()
  private readonly formulaCache = new Map<string, Value>()
  private readonly evaluating = new Set<string>()
  private readonly filesByPath: Map<string, BaseFile>
  readonly notices = new Set<string>()
  private readonly resolve: (target: string) => string | undefined
  private readonly now: Date

  constructor(private readonly definition: BaseDefinition, files: BaseFile[], private readonly options: EvaluateBaseOptions) {
    this.filesByPath = new Map(files.flatMap(file => [[normalizeNotePath(file.path), file], [file.slug, file]] as const))
    this.resolve = options.resolveNote ?? (() => undefined)
    this.now = options.now ?? new Date()
  }

  parse(source: string): BaseExpression {
    let expression = this.parsed.get(source)
    if (!expression) {
      try { expression = parseBaseExpression(source) } catch (error) { expression = error instanceof BaseUnsupportedError ? error : new BaseUnsupportedError(String(error)) }
      this.parsed.set(source, expression)
    }
    if (expression instanceof BaseUnsupportedError) throw expression
    return expression
  }

  /** Evaluates a filter; unsupported parts count as passing so the rest of the filter still applies. */
  matches(filter: BaseFilter | undefined, file: BaseFile): boolean {
    if (filter === undefined) return true
    if (typeof filter === "string") {
      try {
        return truthy(this.evaluate(this.parse(filter), { file, locals: {} }))
      } catch (error) {
        if (!(error instanceof BaseUnsupportedError)) throw error
        this.notices.add(`Ignored filter \`${filter}\`: ${error.message}`)
        return true
      }
    }
    if ("and" in filter) return filter.and.every(item => this.matches(item, file))
    if ("or" in filter) return filter.or.length === 0 || filter.or.some(item => this.matches(item, file))
    return !filter.not.some(item => this.matches(item, file))
  }

  /** Value of a column id such as `file.name` or `note.status`. */
  property(id: string, file: BaseFile): Value {
    const [namespace, ...rest] = id.split(".")
    const key = rest.join(".")
    if (namespace === "file") return this.fileField({ kind: "file", file }, key)
    if (namespace === "formula") return this.formula(key, file)
    if (namespace === "this") return this.thisField(key)
    return this.noteProperty(file, key)
  }

  private noteProperty(file: BaseFile, key: string): Value {
    const value = file.properties[key]
    return value === undefined ? null : value as Value
  }

  private thisField(key: string): Value {
    const file = this.options.thisFile
    if (!file) return null
    if (key === "file") return { kind: "file", file }
    if (key.startsWith("file.")) return this.fileField({ kind: "file", file }, key.slice(5))
    return this.noteProperty(file, key)
  }

  formula(name: string, file: BaseFile): Value {
    const source = this.definition.formulas[name]
    if (source === undefined) return null
    const cacheKey = `${file.path}\0${name}`
    if (this.formulaCache.has(cacheKey)) return this.formulaCache.get(cacheKey)!
    if (this.evaluating.has(cacheKey)) throw new BaseUnsupportedError(`Formula "${name}" refers to itself`)
    this.evaluating.add(cacheKey)
    let value: Value = null
    try {
      value = this.evaluate(this.parse(source), { file, locals: {} })
    } catch (error) {
      if (!(error instanceof BaseUnsupportedError)) throw error
      this.notices.add(`Formula "${name}" could not be evaluated: ${error.message}`)
    } finally {
      this.evaluating.delete(cacheKey)
    }
    this.formulaCache.set(cacheKey, value)
    return value
  }

  private fileField(value: FileValue, field: string): Value {
    const { file } = value
    switch (field) {
      case "name": return fileName(file)
      case "basename": return fileBasename(file)
      case "path": return file.path
      case "folder": return fileFolder(file)
      case "ext": return path.posix.extname(file.path).slice(1)
      case "size": return file.size ?? null
      case "ctime": return file.ctime ?? null
      case "mtime": return file.mtime ?? null
      case "tags": return file.tags
      case "links": return file.links.map(slug => this.fileValue(slug) ?? { kind: "link", target: slug })
      case "properties": return { ...file.properties }
      case "file": return value
      default: throw new BaseUnsupportedError(`file.${field} is not supported`)
    }
  }

  private fileValue(target: string): FileValue | undefined {
    const file = this.filesByPath.get(this.resolve(target) ?? normalizeNotePath(target)) ?? this.filesByPath.get(normalizeNotePath(target))
    return file && { kind: "file", file }
  }

  evaluate(expression: BaseExpression, scope: Scope): Value {
    switch (expression.type) {
      case "literal": return expression.value
      case "list": return expression.items.map(item => this.evaluate(item, scope))
      case "identifier": return this.identifier(expression.name, scope)
      case "member": return this.member(this.evaluate(expression.object, scope), expression.property, expression.object, scope)
      case "index": {
        const object = this.evaluate(expression.object, scope)
        const index = this.evaluate(expression.index, scope)
        if (Array.isArray(object) && typeof index === "number") return object.at(index) ?? null
        if (typeof index === "string") return this.member(object, index, expression.object, scope)
        return null
      }
      case "call": return this.call(expression, scope)
      case "unary": {
        const value = this.evaluate(expression.argument, scope)
        return expression.operator === "!" ? !truthy(value) : typeof value === "number" ? -value : null
      }
      case "binary": return this.binary(expression, scope)
    }
  }

  private identifier(name: string, scope: Scope): Value {
    if (name in scope.locals) return scope.locals[name]
    if (name === "file") return { kind: "file", file: scope.file }
    if (name === "note") return { ...scope.file.properties } as Value
    if (name === "formula") return { kind: "formula-namespace" }
    if (name === "this") return { kind: "this" }
    return this.noteProperty(scope.file, name)
  }

  private member(object: Value, property: string, source: BaseExpression, scope: Scope): Value {
    if (isTagged(object, "formula-namespace")) return this.formula(property, scope.file)
    if (isTagged(object, "this")) return this.thisField(property)
    if (isFile(object)) return this.fileField(object, property)
    if (object === null || object === undefined) return null
    if (property === "length" && (typeof object === "string" || Array.isArray(object))) return object.length
    if (object instanceof Date) {
      const fields: Record<string, () => number> = {
        year: () => object.getUTCFullYear(), month: () => object.getUTCMonth() + 1, day: () => object.getUTCDate(),
        hour: () => object.getUTCHours(), minute: () => object.getUTCMinutes(), second: () => object.getUTCSeconds(), millisecond: () => object.getUTCMilliseconds(),
      }
      if (fields[property]) return fields[property]()
    }
    if (isDuration(object)) {
      const units: Record<string, number> = { days: 86_400_000, hours: 3_600_000, minutes: 60_000, seconds: 1000, milliseconds: 1 }
      if (units[property]) return Math.trunc(object.ms / units[property])
    }
    if (isRecord(object) && !isLink(object)) {
      const value = (object as Record<string, unknown>)[property]
      return value === undefined ? null : value as Value
    }
    throw new BaseUnsupportedError(`Property "${property}" is not supported on ${describe(object)}${source.type === "identifier" ? ` (${source.name})` : ""}`)
  }

  private call(expression: Extract<BaseExpression, { type: "call" }>, scope: Scope): Value {
    const { callee } = expression
    if (callee.type === "identifier") return this.globalCall(callee.name, expression.args, scope)
    if (callee.type !== "member") throw new BaseUnsupportedError("Only functions and methods can be called")
    const target = this.evaluate(callee.object, scope)
    // filter()/map() evaluate their argument once per element.
    if (Array.isArray(target) && (callee.property === "filter" || callee.property === "map")) {
      const [body] = expression.args
      if (!body) throw new BaseUnsupportedError(`${callee.property}() needs an expression`)
      const results = target.map((value, index) => this.evaluate(body, { file: scope.file, locals: { ...scope.locals, value, index } }))
      return callee.property === "map" ? results : target.filter((_, index) => truthy(results[index]))
    }
    const args = expression.args.map(arg => this.evaluate(arg, scope))
    return this.method(target, callee.property, args)
  }

  private globalCall(name: string, argExpressions: BaseExpression[], scope: Scope): Value {
    if (name === "if") {
      const [condition, whenTrue, whenFalse] = argExpressions
      if (!condition || !whenTrue) throw new BaseUnsupportedError("if() needs a condition and a value")
      return truthy(this.evaluate(condition, scope)) ? this.evaluate(whenTrue, scope) : whenFalse ? this.evaluate(whenFalse, scope) : null
    }
    const args = argExpressions.map(arg => this.evaluate(arg, scope))
    switch (name) {
      case "now": return new Date(this.now)
      case "today": return new Date(Date.UTC(this.now.getUTCFullYear(), this.now.getUTCMonth(), this.now.getUTCDate()))
      case "date": return toDate(args[0]) ?? null
      case "duration": {
        const ms = typeof args[0] === "string" ? parseDuration(args[0]) : undefined
        return ms === undefined ? null : { kind: "duration", ms }
      }
      case "number": {
        const value = args[0]
        if (value instanceof Date) return value.getTime()
        if (typeof value === "boolean") return Number(value)
        const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN
        return Number.isNaN(number) ? null : number
      }
      case "list": return Array.isArray(args[0]) ? args[0] : args[0] === null || args[0] === undefined ? [] : [args[0]]
      case "max": case "min": {
        const numbers = args.flat().filter((value): value is number => typeof value === "number")
        return numbers.length ? Math[name](...numbers) : null
      }
      case "link": {
        const target = linkTarget(args[0])
        return target === undefined ? null : { kind: "link", target, display: args[1] === undefined || args[1] === null ? undefined : toText(args[1]) }
      }
      case "file": {
        const target = linkTarget(args[0])
        return target === undefined ? null : this.fileValue(target) ?? null
      }
      default: throw new BaseUnsupportedError(`Function ${name}() is not supported`)
    }
  }

  private method(target: Value, name: string, args: Value[]): Value {
    switch (name) {
      case "isEmpty": return isEmptyValue(target)
      case "isTruthy": return truthy(target)
      case "toString": return toText(target)
      case "isType": return describe(target) === String(args[0]).toLowerCase()
    }
    if (target === null || target === undefined) {
      if (["contains", "containsAll", "containsAny", "startsWith", "endsWith", "hasTag", "hasLink", "hasProperty", "inFolder"].includes(name)) return false
      return null
    }
    if (isFile(target)) return this.fileMethod(target.file, name, args)
    if (typeof target === "string") return stringMethod(target, name, args)
    if (typeof target === "number") return numberMethod(target, name, args)
    if (Array.isArray(target)) return this.listMethod(target, name, args)
    if (target instanceof Date) {
      if (name === "format") return formatDate(target, typeof args[0] === "string" ? args[0] : "YYYY-MM-DD")
      if (name === "date") return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()))
      if (name === "time") return formatDate(target, "HH:mm:ss")
    }
    if (isLink(target)) {
      if (name === "asFile") return this.fileValue(target.target) ?? null
      if (name === "linksTo") {
        const other = linkTarget(args[0])
        return other !== undefined && sameTarget(target.target, other, this.resolve)
      }
    }
    throw new BaseUnsupportedError(`Method ${name}() is not supported on ${describe(target)}`)
  }

  private fileMethod(file: BaseFile, name: string, args: Value[]): Value {
    switch (name) {
      case "hasTag": {
        const tags = file.tags.map(tag => tag.toLowerCase())
        return args.some(arg => {
          const wanted = toText(arg).replace(/^#/, "").toLowerCase()
          return tags.some(tag => tag === wanted || tag.startsWith(`${wanted}/`))
        })
      }
      case "inFolder": {
        const folder = toText(args[0]).replace(/^\/+|\/+$/g, "")
        const own = fileFolder(file)
        return !folder || own === folder || own.startsWith(`${folder}/`)
      }
      case "hasLink": {
        const target = linkTarget(args[0])
        return target !== undefined && file.links.some(link => sameTarget(link, target, this.resolve))
      }
      case "hasProperty": return Object.hasOwn(file.properties, toText(args[0]))
      case "asLink": return { kind: "link", target: file.slug, display: args[0] === undefined ? undefined : toText(args[0]) }
      default: throw new BaseUnsupportedError(`Method file.${name}() is not supported`)
    }
  }

  private listMethod(list: Value[], name: string, args: Value[]): Value {
    const has = (wanted: Value) => list.some(item => this.equals(item, wanted))
    switch (name) {
      case "contains": return has(args[0])
      case "containsAll": return args.every(has)
      case "containsAny": return args.some(has)
      case "join": return list.map(toText).join(args[0] === undefined ? ", " : toText(args[0]))
      case "reverse": return [...list].reverse()
      case "slice": return list.slice(Number(args[0] ?? 0), args[1] === undefined ? undefined : Number(args[1]))
      case "sort": return [...list].sort(compareValues)
      case "unique": return list.filter((item, index) => list.findIndex(other => this.equals(item, other)) === index)
      case "flat": return list.flat() as Value[]
      default: throw new BaseUnsupportedError(`Method ${name}() is not supported on lists`)
    }
  }

  equals(a: Value | undefined, b: Value | undefined): boolean {
    if (a === null || a === undefined || b === null || b === undefined) return (a ?? null) === (b ?? null)
    if (isLink(a) || isLink(b) || isFile(a) || isFile(b)) {
      const left = linkTarget(a), right = linkTarget(b)
      return left !== undefined && right !== undefined && sameTarget(left, right, this.resolve)
    }
    const dateA = toDate(a), dateB = toDate(b)
    if (dateA && dateB && (a instanceof Date || b instanceof Date)) return dateA.getTime() === dateB.getTime()
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => this.equals(item, b[index]))
    if (typeof a === "number" && typeof b === "string" && b.trim() !== "") return a === Number(b)
    if (typeof b === "number" && typeof a === "string" && a.trim() !== "") return b === Number(a)
    if (isDuration(a) && isDuration(b)) return a.ms === b.ms
    return a === b
  }

  private binary(expression: Extract<BaseExpression, { type: "binary" }>, scope: Scope): Value {
    const { operator } = expression
    if (operator === "&&") return truthy(this.evaluate(expression.left, scope)) && truthy(this.evaluate(expression.right, scope))
    if (operator === "||") {
      const left = this.evaluate(expression.left, scope)
      return truthy(left) ? left : this.evaluate(expression.right, scope)
    }
    const left = this.evaluate(expression.left, scope)
    const right = this.evaluate(expression.right, scope)
    switch (operator) {
      case "==": return this.equals(left, right)
      case "!=": return !this.equals(left, right)
      case "<": case ">": case "<=": case ">=": {
        if (left === null || right === null) return false
        const order = compareValues(left, right)
        if (Number.isNaN(order)) return false
        return operator === "<" ? order < 0 : operator === ">" ? order > 0 : operator === "<=" ? order <= 0 : order >= 0
      }
      case "+": case "-": return arithmetic(operator, left, right)
      default: {
        const a = numeric(left), b = numeric(right)
        if (a === undefined || b === undefined) return null
        return operator === "*" ? a * b : operator === "/" ? a / b : a % b
      }
    }
  }
}

/** Numbers and numeric strings (frontmatter often quotes numbers). */
const numeric = (value: Value) => typeof value === "number" ? value : typeof value === "string" && value.trim() && !Number.isNaN(Number(value)) ? Number(value) : undefined

function describe(value: Value | undefined): string {
  if (value === null || value === undefined) return "null"
  if (value instanceof Date) return "date"
  if (Array.isArray(value)) return "list"
  if (isFile(value)) return "file"
  if (isLink(value)) return "link"
  if (isDuration(value)) return "duration"
  if (isRecord(value)) return "object"
  return typeof value
}

function arithmetic(operator: "+" | "-", left: Value, right: Value): Value {
  const date = left instanceof Date ? left : undefined
  const offset = isDuration(right) ? right.ms : typeof right === "string" ? parseDuration(right) : undefined
  if (date && offset !== undefined) return new Date(date.getTime() + (operator === "+" ? offset : -offset))
  if (operator === "-" && date && right instanceof Date) return { kind: "duration", ms: date.getTime() - right.getTime() }
  if (typeof left === "number" && typeof right === "number") return operator === "+" ? left + right : left - right
  if (operator === "+" && Array.isArray(left)) return [...left, ...(Array.isArray(right) ? right : [right])]
  if (operator === "+" && (typeof left === "string" || typeof right === "string")) return toText(left) + toText(right)
  return null
}

/** Sort order: numbers, dates, durations and strings compare naturally; NaN when the types do not compare. */
function compareValues(a: Value, b: Value): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  const dateA = toDate(a), dateB = toDate(b)
  if (dateA && dateB) return dateA.getTime() - dateB.getTime()
  if (isDuration(a) && isDuration(b)) return a.ms - b.ms
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b)
  if (typeof a === "number" && typeof b === "string" && b.trim() && !Number.isNaN(Number(b))) return a - Number(b)
  if (typeof b === "number" && typeof a === "string" && a.trim() && !Number.isNaN(Number(a))) return Number(a) - b
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  if (typeof a === "number" || typeof b === "number" || a instanceof Date || b instanceof Date) return NaN
  return toText(a).localeCompare(toText(b), undefined, { numeric: true, sensitivity: "base" })
}

function stringMethod(value: string, name: string, args: Value[]): Value {
  const text = args.map(toText)
  switch (name) {
    case "contains": return value.includes(text[0] ?? "")
    case "containsAll": return text.every(part => value.includes(part))
    case "containsAny": return text.some(part => value.includes(part))
    case "startsWith": return value.startsWith(text[0] ?? "")
    case "endsWith": return value.endsWith(text[0] ?? "")
    case "lower": return value.toLowerCase()
    case "upper": return value.toUpperCase()
    case "title": return value.replace(/\p{L}[^\s]*/gu, word => word[0].toUpperCase() + word.slice(1).toLowerCase())
    case "trim": return value.trim()
    case "reverse": return [...value].reverse().join("")
    case "repeat": return value.repeat(Math.max(0, Number(args[0]) || 0))
    case "replace": return value.replaceAll(text[0] ?? "", text[1] ?? "")
    case "slice": return value.slice(Number(args[0] ?? 0), args[1] === undefined ? undefined : Number(args[1]))
    case "split": return value.split(text[0] ?? "", args[1] === undefined ? undefined : Number(args[1]))
    default: throw new BaseUnsupportedError(`Method ${name}() is not supported on strings`)
  }
}

function numberMethod(value: number, name: string, args: Value[]): Value {
  switch (name) {
    case "abs": return Math.abs(value)
    case "ceil": return Math.ceil(value)
    case "floor": return Math.floor(value)
    case "round": {
      const factor = 10 ** (Number(args[0]) || 0)
      return Math.round(value * factor) / factor
    }
    case "toFixed": return value.toFixed(Math.min(100, Math.max(0, Number(args[0]) || 0)))
    default: throw new BaseUnsupportedError(`Method ${name}() is not supported on numbers`)
  }
}

const DEFAULT_LABELS: Record<string, string> = {
  "file.name": "Name", "file.basename": "Name", "file.path": "Path", "file.folder": "Folder", "file.ext": "Extension",
  "file.size": "Size", "file.ctime": "Created", "file.mtime": "Modified", "file.tags": "Tags", "file.links": "Links",
}

function columnLabel(definition: BaseDefinition, id: string): string {
  return definition.properties[id]?.displayName ?? DEFAULT_LABELS[id] ?? id.replace(/^(note|formula|this)\./, "")
}

function toCell(value: Value | undefined, resolve: (target: string) => string | undefined): BaseCell {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const link = WIKILINK.exec(value.trim())
    if (!link) return value
    const slug = resolve(link[1])
    return { text: link[2] ?? path.posix.basename(link[1]), ...(slug ? { slug } : {}) }
  }
  if (Array.isArray(value)) return value.map(item => toCell(item, resolve))
  if (isFile(value)) return { text: fileBasename(value.file), slug: value.file.slug }
  if (isLink(value)) {
    const slug = resolve(value.target)
    return { text: value.display ?? path.posix.basename(value.target), ...(slug ? { slug } : {}) }
  }
  return toText(value)
}

/** Evaluates every view of a base over `files`. Unsupported expressions become notices; this never throws on bad input. */
export function evaluateBase(definition: BaseDefinition, files: BaseFile[], options: EvaluateBaseOptions = {}): BaseResult {
  const evaluator = new Evaluator(definition, files, options)
  const resolve = (target: string) => options.resolveNote?.(target) ?? files.find(file => file.slug === normalizeNotePath(target))?.slug
  const matching = files.filter(file => evaluator.matches(definition.filters, file))
  const globalNotices = new Set(evaluator.notices)
  evaluator.notices.clear()

  const views = definition.views.map((view): BaseViewResult => {
    const rows = matching.filter(file => evaluator.matches(view.filters, file))
    const sorts = view.sort.length ? view.sort : [{ property: "file.name", direction: "ASC" as const }]
    const sortValues = new Map(rows.map(file => [file, sorts.map(sort => evaluator.property(sort.property, file))]))
    rows.sort((a, b) => {
      for (const [index, sort] of sorts.entries()) {
        const order = compareForSort(sortValues.get(a)![index], sortValues.get(b)![index], sort.direction)
        if (order) return order
      }
      return a.path.localeCompare(b.path)
    })
    const limited = view.limit ? rows.slice(0, view.limit) : rows

    const toRow = (file: BaseFile): BaseRow => ({
      slug: file.slug,
      title: typeof file.properties.title === "string" && file.properties.title ? file.properties.title : fileBasename(file),
      cells: Object.fromEntries(view.order.map(id => [id, id === "file.name" || id === "file.basename"
        ? { text: fileBasename(file), slug: file.slug }
        : toCell(evaluator.property(id, file), resolve)])),
    })

    let groups: BaseGroup[]
    if (view.groupBy) {
      const { property, direction } = view.groupBy
      const buckets = new Map<string, { key: Value; files: BaseFile[] }>()
      for (const file of limited) {
        const key = evaluator.property(property, file)
        const label = isEmptyValue(key) ? "" : toText(key)
        if (!buckets.has(label)) buckets.set(label, { key: isEmptyValue(key) ? null : key, files: [] })
        buckets.get(label)!.files.push(file)
      }
      groups = [...buckets.entries()]
        .sort(([, a], [, b]) => compareForSort(a.key, b.key, direction))
        .map(([label, bucket]) => ({ label: label || null, rows: bucket.files.map(toRow) }))
    } else groups = [{ label: null, rows: limited.map(toRow) }]

    const notices = [...view.notices, ...evaluator.notices]
    evaluator.notices.clear()
    return {
      name: view.name,
      type: view.type,
      columns: view.order.map(id => ({ id, label: columnLabel(definition, id) })),
      groups,
      grouped: Boolean(view.groupBy),
      count: limited.length,
      notices: [...new Set(notices)],
    }
  })
  return { views, notices: [...new Set([...definition.notices, ...globalNotices])] }
}

/** compareValues in `direction`, with empty values last either way and mismatched types ordered by their text. */
function compareForSort(a: Value, b: Value, direction: "ASC" | "DESC"): number {
  const emptyA = isEmptyValue(a), emptyB = isEmptyValue(b)
  if (emptyA || emptyB) return Number(emptyA) - Number(emptyB)
  const order = compareValues(a, b)
  const result = Number.isNaN(order) ? toText(a).localeCompare(toText(b)) : order
  return direction === "DESC" ? -result : result
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\r?\n/g, " ")

function cellHtml(cell: BaseCell, href: (slug: string) => string): string {
  if (cell === null) return ""
  if (Array.isArray(cell)) return cell.map(item => cellHtml(item, href)).filter(Boolean).join(", ")
  if (typeof cell === "object") return cell.slug ? `<a href="${escapeHtml(href(cell.slug))}" class="base-link">${escapeHtml(cell.text)}</a>` : escapeHtml(cell.text)
  if (typeof cell === "boolean") return cell ? "Yes" : "No"
  return escapeHtml(String(cell))
}

/**
 * Static HTML for one view, used for note embeds and the search index. The
 * output is a single line so it stays one HTML block inside markdown.
 */
export function renderBaseViewHtml(view: BaseViewResult, options: { href: (slug: string) => string }): string {
  const { href } = options
  const notices = view.notices.map(notice => `<p class="base-notice">${escapeHtml(notice)}</p>`).join("")
  if (!view.count) return `<div class="base-view">${notices}<p class="base-empty">No matching notes.</p></div>`
  const details = view.columns.filter(column => column.id !== "file.name")
  const title = (row: BaseRow) => `<a href="${escapeHtml(href(row.slug))}" class="base-link">${escapeHtml(row.title)}</a>`
  const groupHeading = (group: BaseGroup) => view.grouped ? `<p class="base-group">${escapeHtml(group.label ?? "(empty)")}</p>` : ""

  let body: string
  if (view.type === "table") {
    const head = `<thead><tr>${view.columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>`
    body = view.groups.map(group => {
      const groupRow = view.grouped ? `<tr class="base-group"><th colspan="${view.columns.length}">${escapeHtml(group.label ?? "(empty)")}</th></tr>` : ""
      return `<tbody>${groupRow}${group.rows.map(row => `<tr>${view.columns.map(column => `<td>${cellHtml(row.cells[column.id], href)}</td>`).join("")}</tr>`).join("")}</tbody>`
    }).join("")
    body = `<div class="base-table"><table>${head}${body}</table></div>`
  } else if (view.type === "cards") {
    body = view.groups.map(group => `${groupHeading(group)}<div class="base-cards">${group.rows.map(row =>
      `<div class="base-card">${title(row)}${details.length ? `<dl>${details.map(column => `<dt>${escapeHtml(column.label)}</dt><dd>${cellHtml(row.cells[column.id], href) || "-"}</dd>`).join("")}</dl>` : ""}</div>`).join("")}</div>`).join("")
  } else {
    body = view.groups.map(group => `${groupHeading(group)}<ul class="base-list">${group.rows.map(row => {
      const extra = details.map(column => cellHtml(row.cells[column.id], href)).filter(Boolean)
      return `<li>${title(row)}${extra.length ? ` <span class="base-list-meta">${extra.join(" · ")}</span>` : ""}</li>`
    }).join("")}</ul>`).join("")
  }
  return `<div class="base-view">${notices}${body}</div>`
}
