export function buildStatusPageUrl({
  slug,
  customDomain,
  baseUrl,
}: {
  slug: string;
  customDomain?: string | null;
  baseUrl?: string | null;
}) {
  if (customDomain) return `https://${customDomain}`;

  const normalizedBaseUrl = baseUrl?.trim().replace(/\/+$/, "");
  if (!normalizedBaseUrl) return `https://${slug}.openstatus.dev`;

  if (normalizedBaseUrl.includes("{slug}")) {
    return normalizedBaseUrl.split("{slug}").join(encodeURIComponent(slug));
  }

  try {
    const url = new URL(normalizedBaseUrl);
    url.hostname = `${slug}.${url.hostname}`;
    return url.toString().replace(/\/$/, "");
  } catch {
    return normalizedBaseUrl;
  }
}
