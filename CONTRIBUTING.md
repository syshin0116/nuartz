# Contributing to Nuartz

Thanks for helping improve Nuartz. Bug reports, documentation fixes, examples, and focused feature contributions are welcome.

## Development setup

Requirements:

- Bun 1.3 or later
- Git

```bash
git clone https://github.com/syshin0116/nuartz.git
cd nuartz
bun install --frozen-lockfile
bun run check
bun run build
```

Run the development site with `bun dev`. Example content lives in `apps/web/content` and the core library lives in `packages/nuartz`.

## Pull requests

1. Open or reference an issue for behavior changes that need discussion.
2. Create a focused branch from `main`.
3. Add or update tests when changing library behavior.
4. Run `bun run check` and `bun run build`.
5. Update documentation and `CHANGELOG.md` when the public API changes.
6. Open a pull request using the repository template.

Keep pull requests small enough to review. Do not include generated build output, personal vault content, or secrets.

## Reporting security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md) instead.
