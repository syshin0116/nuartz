import { ImageResponse } from "next/og"
import config from "@/nuartz.config"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const dynamic = "force-static"

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0f0f0f",
          color: "#fafafa",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>{config.site.title}</div>
        {config.site.description && (
          <div style={{ fontSize: 24, color: "#a1a1aa", marginTop: "16px" }}>{config.site.description}</div>
        )}
      </div>
    ),
    { ...size }
  )
}
