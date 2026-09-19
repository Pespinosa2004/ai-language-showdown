import { localCatalog } from "@/lib/store";

export async function GET() {
  return Response.json(localCatalog());
}
