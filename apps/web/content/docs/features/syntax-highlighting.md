---
title: Syntax Highlighting
date: 2026-03-01
tags:
  - nuartz
  - features
  - code
description: Code syntax highlighting in nuartz powered by Shiki — build-time highlighting with accurate grammar parsing.
---

nuartz highlights code blocks at build time using [Shiki](https://github.com/shikijs/shiki), the same engine that powers VS Code's syntax highlighting. No client-side JavaScript is needed — just pre-calculated CSS.

## Basic Code Blocks

Wrap code in triple backticks with a language identifier:

```typescript
interface Note {
  title: string
  tags: string[]
  content: string
}

function renderNote(note: Note): string {
  return `<h1>${note.title}</h1>`
}
```

```python
from pathlib import Path

def read_notes(content_dir: str) -> list[dict]:
    """Read all markdown files from the content directory."""
    notes = []
    for path in Path(content_dir).glob("**/*.md"):
        notes.append({"path": str(path), "content": path.read_text()})
    return notes
```

```bash
# Clone and start nuartz
git clone https://github.com/syshin0116/nuartz.git
cd nuartz
bun install
bun dev
```

```yaml
# Example frontmatter
title: My Note
date: 2026-03-01
tags:
  - example
  - demo
```

```json
{
  "name": "nuartz",
  "version": "0.1.0",
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0"
  }
}
```

## Titles

Add a title to your code block:

````markdown
```ts title="nuartz.config.ts"
export default defineConfig({ ... })
```
````

```ts title="nuartz.config.ts"
import { defineConfig } from "nuartz"

export default defineConfig({
  site: { title: "My Garden" },
})
```

## Line Highlighting

Highlight specific lines with `{line-numbers}`:

````markdown
```ts {2-3}
const a = 1
const b = 2  // highlighted
const c = 3  // highlighted
```
````

```ts {2-3}
function setup() {
  const config = loadConfig()   // highlighted
  const content = readContent() // highlighted
  return { config, content }
}
```

## Supported Languages

Shiki supports 200+ languages out of the box, including TypeScript, Python, Rust, Go, SQL, YAML, JSON, Bash, CSS, HTML, and many more.

> [!tip] Performance
> Syntax highlighting runs at build time, so it adds zero weight to your client bundle. Your visitors get perfectly highlighted code with no JavaScript overhead.

## Related

- [[docs/authoring-content|Authoring Content]] — general content writing guide
- [[docs/features/mermaid|Mermaid Diagrams]] — render diagrams from code blocks
