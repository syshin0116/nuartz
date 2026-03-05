import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

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
        <div style={{ fontSize: 72, fontWeight: 700 }}>Nuartz</div>
        <div style={{ fontSize: 24, color: "#a1a1aa", marginTop: "16px" }}>
          Digital garden
        </div>
      </div>
    ),
    { ...size }
  )
}
