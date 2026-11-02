import { BlockList, isIP } from "node:net"
import { lookup } from "node:dns/promises"

// Ranges a server-side fetch must never reach: loopback, private networks,
// link-local (cloud metadata), CGNAT, multicast and other reserved space.
const blocked = new BlockList()
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(network, prefix, "ipv4")
for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["64:ff9b::", 96],
] as const) blocked.addSubnet(network, prefix, "ipv6")

export function isBlockedAddress(address: string): boolean {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1]
  if (mapped) return blocked.check(mapped, "ipv4")
  const family = isIP(address)
  if (!family) return true
  return blocked.check(address, family === 4 ? "ipv4" : "ipv6")
}

type ResolveHost = (host: string, options: { all: true }) => Promise<{ address: string }[]>

/** Returns the URL when it is http(s) and every resolved address is public. */
export async function resolvePublicUrl(input: string, resolve: ResolveHost = lookup): Promise<URL | null> {
  let url: URL
  try { url = new URL(input) } catch { return null }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  if (url.username || url.password) return null
  const host = url.hostname.replace(/^\[|\]$/g, "")
  try {
    const addresses = isIP(host) ? [{ address: host }] : await resolve(host, { all: true })
    if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) return null
  } catch {
    return null
  }
  return url
}

/**
 * Fetches a public URL, re-validating every redirect hop and capping the body.
 * DNS can still change between the check and the request; this narrows, not
 * eliminates, rebinding.
 */
export async function fetchPublicText(input: string, { maxBytes = 512_000, maxRedirects = 3, timeoutMs = 5000 } = {}): Promise<string | null> {
  let target = input
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await resolvePublicUrl(target)
    if (!url) return null
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; nuartz-preview/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location) return null
      target = new URL(location, url).toString()
      continue
    }
    if (!response.ok || !response.body) return null
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (size < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.byteLength
    }
    await reader.cancel().catch(() => {})
    return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, maxBytes))
  }
  return null
}
