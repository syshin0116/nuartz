import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title") ?? "nuartz"
  const description = searchParams.get("description") ?? ""

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#0f0f0f",
          color: "#fafafa",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#a1a1aa" }}>
          nuartz
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: title.length > 40 ? 48 : 60,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "900px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 24,
                color: "#a1a1aa",
                maxWidth: "800px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {description}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #27272a",
            paddingTop: "20px",
            fontSize: 18,
            color: "#71717a",
          }}
        >
          <span>nuartz.dev</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
