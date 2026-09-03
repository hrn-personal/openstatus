import { db, sql } from "@openstatus/db";
import { page } from "@openstatus/db/src/schema";

import { normalizeCaddyDomain } from "../../../lib/caddy-domain";
import { domainPointsToTarget } from "../../../lib/domain-dns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

function getCnameTarget() {
  const configured = normalizeCaddyDomain(
    process.env.CUSTOM_DOMAIN_CNAME_TARGET,
  );
  if (configured) return configured;

  const statusPageUrl = process.env.STATUS_PAGE_URL;
  if (!statusPageUrl) return null;

  try {
    return normalizeCaddyDomain(
      new URL(statusPageUrl.split("{slug}.").join("")).hostname,
    );
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedDomain = url.searchParams.get("domain");
  const domain = normalizeCaddyDomain(
    requestedDomain ??
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host"),
  );
  if (!domain) {
    return Response.json({ configured: false }, { status: 400, headers });
  }

  const row = await db
    .select({ id: page.id })
    .from(page)
    .where(sql`lower(${page.customDomain}) = ${domain}`)
    .get();

  const target = requestedDomain ? getCnameTarget() : null;
  const dns = requestedDomain
    ? target
      ? await domainPointsToTarget(domain, target)
      : false
    : true;
  const configured = Boolean(row);

  return Response.json(
    { configured, dns, domain },
    { status: configured && dns ? 200 : 404, headers },
  );
}
