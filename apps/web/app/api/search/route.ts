import searchData from "@/.generated/search.json"

export const dynamic = "force-static"

export async function GET() {
  return Response.json(searchData)
}
