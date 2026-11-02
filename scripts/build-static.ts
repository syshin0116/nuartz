/**
 * Static export for hosts without a Node server (GitHub Pages, S3, any CDN).
 *
 *   NUARTZ_BASE_PATH=/repo NUARTZ_SITE_URL=https://user.github.io/repo bun run build:static
 *
 * Output: apps/web/out. Routes that need a server are moved aside for the
 * build and always restored: /api/preview (external link previews) and /og
 * (per-page social images).
 */
import fs from "node:fs/promises"
import path from "node:path"

const APP_DIR = path.join(import.meta.dir, "../apps/web")
const SERVER_ONLY_ROUTES = ["app/api/preview", "app/og"]
const BACKUP_DIR = path.join(APP_DIR, ".server-routes-backup")

async function run(cmd: string[], cwd: string, env: Record<string, string>) {
  const proc = Bun.spawn(cmd, { cwd, env: { ...process.env, ...env }, stdout: "inherit", stderr: "inherit" })
  if (await proc.exited !== 0) throw new Error(`${cmd.join(" ")} failed`)
}

const env = { NUARTZ_OUTPUT: "export" }
const root = path.join(import.meta.dir, "..")
await run(["bun", "run", "build:pkg"], root, env)
await run(["bun", "run", "prebuild"], root, env)

// Cached route types from earlier builds still reference the moved routes.
await fs.rm(path.join(APP_DIR, ".next"), { recursive: true, force: true })
await fs.rm(path.join(APP_DIR, "out"), { recursive: true, force: true })

const moved: string[] = []
try {
  for (const route of SERVER_ONLY_ROUTES) {
    const from = path.join(APP_DIR, route)
    const to = path.join(BACKUP_DIR, route)
    await fs.mkdir(path.dirname(to), { recursive: true })
    await fs.rename(from, to)
    moved.push(route)
  }
  await run(["bunx", "next", "build", "--webpack"], APP_DIR, env)
  await run(["bunx", "pagefind", "--site", "out", "--output-path", "out/pagefind"], APP_DIR, env)
} finally {
  for (const route of moved) await fs.rename(path.join(BACKUP_DIR, route), path.join(APP_DIR, route))
  await fs.rm(BACKUP_DIR, { recursive: true, force: true })
}
console.log("build:static: wrote apps/web/out")
