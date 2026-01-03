/**
 * Helper to create Next.js MDX options from Quartz config
 */

import type { QuartzConfig } from '../cfg'
import type { BuildCtx } from '../util/ctx'

export interface NextMDXOptions {
  remarkPlugins: any[]
  rehypePlugins: any[]
}

/**
 * Convert Quartz transformer plugins to Next.js MDX options
 *
 * @example
 * ```ts
 * import createMDX from '@next/mdx'
 * import { createNextMDXOptions } from '@quartz-nextjs/core'
 * import quartzConfig from './quartz.config'
 *
 * const withMDX = createMDX({
 *   options: createNextMDXOptions(quartzConfig)
 * })
 * ```
 */
export function createNextMDXOptions(
  quartzConfig: QuartzConfig,
  ctx?: Partial<BuildCtx>
): NextMDXOptions {
  // Create a minimal BuildCtx for plugins
  const buildCtx: BuildCtx = {
    cfg: quartzConfig,
    allSlugs: ctx?.allSlugs || [],
    ...ctx,
  } as BuildCtx

  const remarkPlugins: any[] = []
  const rehypePlugins: any[] = []

  // Collect all transformer plugins
  for (const transformer of quartzConfig.plugins.transformers) {
    // Add markdown plugins (remark)
    if (transformer.markdownPlugins) {
      const plugins = transformer.markdownPlugins(buildCtx)
      remarkPlugins.push(...plugins)
    }

    // Add HTML plugins (rehype)
    if (transformer.htmlPlugins) {
      const plugins = transformer.htmlPlugins(buildCtx)
      rehypePlugins.push(...plugins)
    }
  }

  return {
    remarkPlugins,
    rehypePlugins,
  }
}
