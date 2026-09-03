const labelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export type CaddyDomainLookup = {
  domain: string;
  slug: string | null;
};

export function normalizeCaddyDomain(input: string | null | undefined) {
  const domain = input?.trim().toLowerCase().replace(/\.$/, "");
  if (!domain || domain.length > 253 || domain.includes(":")) return null;

  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !labelPattern.test(label))) {
    return null;
  }
  if (labels.every((label) => /^\d+$/.test(label))) return null;

  return domain;
}

function resolveConfiguredSlug(
  domain: string,
  statusPageUrl: string | null | undefined,
) {
  if (!statusPageUrl?.includes("{slug}")) return null;

  const marker = "openstatus-slug-placeholder";
  try {
    const configuredHost = new URL(
      statusPageUrl.split("{slug}").join(marker),
    ).hostname.toLowerCase();
    const parts = configuredHost.split(marker);
    if (parts.length !== 2) return null;

    const [start, end] = parts;
    if (!domain.startsWith(start) || !domain.endsWith(end)) return null;

    const slugEnd =
      end.length === 0 ? domain.length : domain.length - end.length;
    const slug = domain.slice(start.length, slugEnd);
    return /^[a-z0-9-]{3,}$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}

export function resolveCaddyDomainLookup({
  domain,
  statusPageUrl,
}: {
  domain: string | null | undefined;
  statusPageUrl: string | null | undefined;
}): CaddyDomainLookup | null {
  const normalizedDomain = normalizeCaddyDomain(domain);
  if (!normalizedDomain) return null;

  return {
    domain: normalizedDomain,
    slug: resolveConfiguredSlug(normalizedDomain, statusPageUrl),
  };
}
