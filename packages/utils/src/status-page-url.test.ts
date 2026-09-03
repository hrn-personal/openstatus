import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { buildStatusPageUrl } from "./status-page-url";

describe("buildStatusPageUrl", () => {
  it("uses the hosted subdomain when no base URL is configured", () => {
    expect(buildStatusPageUrl({ slug: "acme" })).toBe(
      "https://acme.openstatus.dev",
    );
  });

  it("uses a path under the self-hosted status page URL", () => {
    expect(
      buildStatusPageUrl({
        slug: "acme",
        baseUrl: "https://status.example.com/",
      }),
    ).toBe("https://status.example.com/acme");
  });

  it("supports wildcard-domain URL templates", () => {
    expect(
      buildStatusPageUrl({
        slug: "acme",
        baseUrl: "https://{slug}.status.example.com",
      }),
    ).toBe("https://acme.status.example.com");
  });

  it("prefers a custom domain", () => {
    expect(
      buildStatusPageUrl({
        slug: "acme",
        customDomain: "status.acme.com",
        baseUrl: "https://status.example.com",
      }),
    ).toBe("https://status.acme.com");
  });
});
