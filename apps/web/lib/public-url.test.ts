import { describe, expect, it } from "vitest"
import { isBlockedAddress, resolvePublicUrl } from "./public-url"

const resolvesTo = (...addresses: string[]) => async () => addresses.map(address => ({ address, family: address.includes(":") ? 6 : 4 }))

describe("isBlockedAddress", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "not-an-ip"])("blocks %s", address => {
    expect(isBlockedAddress(address)).toBe(true)
  })

  it.each(["93.184.216.34", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])("allows %s", address => {
    expect(isBlockedAddress(address)).toBe(false)
  })
})

describe("resolvePublicUrl", () => {
  it("accepts http(s) URLs that resolve only to public addresses", async () => {
    expect((await resolvePublicUrl("https://example.com/a", resolvesTo("93.184.216.34")))?.href).toBe("https://example.com/a")
  })

  it("rejects hosts with any private address, non-http schemes, credentials, and IP literals in private space", async () => {
    expect(await resolvePublicUrl("https://mixed.test", resolvesTo("93.184.216.34", "10.0.0.5"))).toBeNull()
    expect(await resolvePublicUrl("file:///etc/passwd", resolvesTo("93.184.216.34"))).toBeNull()
    expect(await resolvePublicUrl("https://user:pw@example.com", resolvesTo("93.184.216.34"))).toBeNull()
    expect(await resolvePublicUrl("http://169.254.169.254/latest/meta-data", resolvesTo())).toBeNull()
    expect(await resolvePublicUrl("http://[::1]:3000", resolvesTo())).toBeNull()
    expect(await resolvePublicUrl("not a url")).toBeNull()
  })

  it("rejects hosts that fail to resolve", async () => {
    expect(await resolvePublicUrl("https://nowhere.test", async () => { throw new Error("ENOTFOUND") })).toBeNull()
  })
})
