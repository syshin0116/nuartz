---
title: Docker Support
---

nuartz can be previewed locally using Docker without installing Node.js or Bun on your machine.

## Quick Start

From the repo root, run:

```shell
docker build -t nuartz .
docker run --rm -p 3000:3000 -v $(pwd)/apps/web/content:/app/apps/web/content nuartz
```

Then open [http://localhost:3000](http://localhost:3000).

> [!warning] Not for production
> This Docker setup is intended for local preview only. For production, deploy to Vercel, Netlify, or a Node.js host. See [[hosting]].

## Dockerfile

If a `Dockerfile` doesn't exist yet, create one at the repo root:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g bun && bun install
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "apps/web/node_modules/.bin/next", "start", "--dir", "apps/web"]
```

## Mounting Content

The `-v` flag mounts your local `content/` directory into the container so edits reflect immediately (in dev mode). In production build mode, content is bundled at build time and the volume is not needed.

## Docker Compose

For a more ergonomic setup, create a `docker-compose.yml`:

```yaml
services:
  nuartz:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web/content:/app/apps/web/content
```

Then run with:

```shell
docker compose up
```
