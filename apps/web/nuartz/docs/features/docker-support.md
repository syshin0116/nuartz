---
title: Docker Support
---

> [!warning] Not built-in
> Nuartz does not ship a `Dockerfile` out of the box. This page shows how to add one yourself.

You can containerize Nuartz using Docker to run it locally without installing Node.js or Bun, or to deploy it to any container host.

## Creating a Dockerfile

Create a `Dockerfile` at the **repo root**:

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build:pkg
RUN bun run --cwd apps/web build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
```

> [!note]
> The `standalone` output requires `output: "standalone"` in `apps/web/next.config.ts`. Add it if it's not already there.

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
    environment:
      - NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```shell
docker compose up
```

## Mounting content for development

If you want live content editing without rebuilding the image, mount your content directory:

```shell
docker run --rm -p 3000:3000 \
  -v $(pwd)/apps/web/content:/app/apps/web/content \
  nuartz
```

> [!warning] Production note
> Mounting content at runtime only works for static-read scenarios. API routes that scan the filesystem read from the mounted path, so changes will reflect on next request.
