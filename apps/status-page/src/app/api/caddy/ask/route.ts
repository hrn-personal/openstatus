import { db, sql } from "@openstatus/db";
import { page } from "@openstatus/db/src/schema";

import { resolveCaddyDomainLookup } from "../../../../lib/caddy-domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (process.env.SELF_HOST !== "true") {
    return new Response(null, { status: 404, headers });
  }

  const lookup = resolveCaddyDomainLookup({
    domain: new URL(request.url).searchParams.get("domain"),
    statusPageUrl: process.env.STATUS_PAGE_URL,
  });
  if (!lookup) return new Response(null, { status: 400, headers });

  const row = await db
    .select({ id: page.id })
    .from(page)
    .where(
      lookup.slug
        ? sql`lower(${page.customDomain}) = ${lookup.domain} OR lower(${page.slug}) = ${lookup.slug}`
        : sql`lower(${page.customDomain}) = ${lookup.domain}`,
    )
    .get();

  return new Response(null, { status: row ? 200 : 404, headers });
}
