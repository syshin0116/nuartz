/** Sub-path the site is served from ("" at the domain root). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

/** True in `output: "export"` builds, where API routes and /og do not exist. */
export const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1"

/** Prefixes a root-relative URL for fetch(), <img>, <iframe> and other non-next/link uses. */
export const withBasePath = (pathname: string) => `${basePath}${pathname}`

/** Inverse of withBasePath for hrefs read back from rendered HTML. */
export function stripBasePath(pathname: string): string {
  if (!basePath) return pathname
  return pathname === basePath ? "/" : pathname.startsWith(basePath + "/") ? pathname.slice(basePath.length) : pathname
}
