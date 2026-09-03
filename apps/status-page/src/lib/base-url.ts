import { buildStatusPageUrl } from "@openstatus/utils";

export function getBaseUrl({
  slug,
  customDomain,
}: {
  slug?: string;
  customDomain?: string;
}) {
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:3000/${slug}`;
  }
  return buildStatusPageUrl({
    slug: slug ?? "",
    customDomain,
    baseUrl: process.env.STATUS_PAGE_URL,
  });
}
