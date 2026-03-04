import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title") ?? "nuartz"
  const description = searchParams.get("description") ?? "Obsidian-compatible digital garden"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "16px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          nuartz
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#f9fafb",
            lineHeight: 1.2,
            marginBottom: "16px",
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: "20px",
              color: "#9ca3af",
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
