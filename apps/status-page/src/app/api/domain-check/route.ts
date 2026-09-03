import { db, sql } from "@openstatus/db";
import { page } from "@openstatus/db/src/schema";

import { normalizeCaddyDomain } from "../../../lib/caddy-domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function GET(request: Request) {
  const domain = normalizeCaddyDomain(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  );
  if (!domain) {
    return Response.json({ configured: false }, { status: 400, headers });
  }

  const row = await db
    .select({ id: page.id })
    .from(page)
    .where(sql`lower(${page.customDomain}) = ${domain}`)
    .get();

  return Response.json(
    { configured: Boolean(row), domain },
    { status: row ? 200 : 404, headers },
  );
}
