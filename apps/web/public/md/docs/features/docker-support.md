# Docker Support

> [!warning] Not built-in
> Nuartz does not ship a `Dockerfile` out of the box. This page shows how to add one yourself.

You can containerize Nuartz using Docker to run it locally without installing Node.js or Bun, or to deploy it to any container host.

## Creating a Dockerfile

Create a `Dockerfile` at the **repo root**:

```dockerfile
FROM node:22-slim AS builder
# Native dependencies (better-sqlite3) install with Node available.
RUN npm install -g bun@1.3.10
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
# build:pkg + generate + next build
RUN bun run build

FROM node:22-slim AS runner
WORKDIR /app
COPY --from=builder /app ./
WORKDIR /app/apps/web
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "/app/node_modules/next/dist/bin/next", "start"]
```

Add a `.dockerignore` so local builds and dependencies are not copied in:

```
node_modules
**/node_modules
**/.next
apps/web/.generated
apps/web/out
```

> [!note]
> `bun run build` includes `bun run generate`, which renders the notes and writes the data the app reads. A plain `next build` without it fails. The runtime image needs Node.js 22.12 or later.

> [!note] Dates without git history
> `generate` reads first and last commit dates from git. `COPY . .` usually leaves out `.git`, so notes without `date` / `modified` frontmatter fall back to file modification times.

## Building and running

```shell
docker build -t nuartz .
docker run --rm -p 3000:3000 nuartz
```

Open [http://localhost:3000](http://localhost:3000).

## Docker Compose

```yaml
# docker-compose.yml
services:
  nuartz:
    build: .
    ports:
      - "3000:3000"
```

```shell
docker compose up
```

Canonical URLs, the sitemap, and RSS are written at build time from `site.baseUrl` in `apps/web/nuartz.config.ts`, so set it to the container's public URL before building the image.

## Content changes

Notes are rendered when the image is built. Mounting `apps/web/content` into a running container has no effect; rebuild the image after editing content.
