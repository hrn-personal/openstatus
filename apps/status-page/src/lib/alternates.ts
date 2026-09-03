import { buildStatusPageUrl } from "@openstatus/utils";
import type { Metadata } from "next";

// Next.js merges `alternates` shallowly, so a deeper segment that sets it
// replaces the parent's entirely — always return the full object.
export function statusPageAlternates({
  slug,
  customDomain,
  markdownPath = "/.md",
}: {
  slug: string;
  customDomain?: string | null;
  markdownPath?: string;
}): Metadata["alternates"] {
  const base = buildStatusPageUrl({
    slug,
    customDomain,
    baseUrl: process.env.STATUS_PAGE_URL,
  });
  return {
    canonical: base,
    types: {
      "text/markdown": `${base}${markdownPath}`,
      "application/json": `${base}/api/status/summary.json`,
    },
  };
}
