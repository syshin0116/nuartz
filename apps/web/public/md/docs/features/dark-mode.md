# Dark Mode

> nuartz respects your system theme and lets you toggle dark mode from the header.

nuartz supports dark mode out of the box using [next-themes](https://github.com/pacocoursey/next-themes).

## Behaviour

- On first visit, the theme follows `theme.defaultMode` in `nuartz.config.ts` (default `"system"`, which matches your operating system's `prefers-color-scheme`).
- A toggle button in the site header lets you switch between light and dark mode manually.
- Your choice is saved in `localStorage` and persists across page loads and navigation.

## System preference

If you have never toggled the switch and `defaultMode` is `"system"`, nuartz follows your system setting. Change your OS appearance and the site updates immediately without a page reload.

To start in a fixed theme, set `"light"` or `"dark"`:

```ts title="apps/web/nuartz.config.ts"
theme: { defaultMode: "dark" },
```

Readers can still switch with the toggle. To remove dark mode entirely, set `features.darkMode: false`: the toggle is hidden and the site is always light.

## Related

- [Configuration](https://nuartz.vercel.app/docs/configuration) - `theme` and `features` options
- [Getting Started](https://nuartz.vercel.app/docs/getting-started) - initial setup
