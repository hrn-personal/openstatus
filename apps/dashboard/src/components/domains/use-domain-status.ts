import type { DomainVerificationStatusProps } from "@openstatus/api/src/router/domain";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { StepCardVariant } from "@/components/forms/step-card";
import { useDeploymentConfig } from "@/lib/deployment-context";
import { useTRPC } from "@/lib/trpc/client";

export function useDomainStatus(domain?: string) {
  const trpc = useTRPC();
  const { customDomainCnameTarget, vercelDomainsConfigured } =
    useDeploymentConfig();
  const enabled = vercelDomainsConfigured && Boolean(domain);
  const {
    data: domainJson,
    refetch: refetchDomain,
    isLoading: isLoadingDomain,
    isRefetching: isRefetchingDomain,
  } = useQuery(
    trpc.domain.getDomainResponse.queryOptions({ domain }, { enabled }),
  );
  const {
    data: configJson,
    refetch: refetchConfig,
    isLoading: isLoadingConfig,
    isRefetching: isRefetchingConfig,
  } = useQuery(
    trpc.domain.getConfigResponse.queryOptions({ domain }, { enabled }),
  );
  const {
    data: verificationJson,
    refetch: refetchVerification,
    isLoading: isLoadingVerification,
    isRefetching: isRefetchingVerification,
  } = useQuery(
    trpc.domain.verifyDomain.queryOptions(
      { domain },
      { enabled: enabled && !domainJson?.verified },
    ),
  );
  const {
    data: selfHostedReady,
    refetch: refetchSelfHosted,
    isFetching: isFetchingSelfHosted,
  } = useQuery({
    queryKey: ["self-hosted-custom-domain", domain],
    queryFn: async () => {
      const response = await fetch(
        `https://${customDomainCnameTarget}/api/domain-check?domain=${encodeURIComponent(domain ?? "")}`,
        { cache: "no-store" },
      );
      if (!response.ok) return false;

      const result: unknown = await response.json();
      return (
        typeof result === "object" &&
        result !== null &&
        "configured" in result &&
        result.configured === true &&
        "domain" in result &&
        result.domain === domain?.toLowerCase()
      );
    },
    enabled:
      !vercelDomainsConfigured &&
      Boolean(customDomainCnameTarget) &&
      Boolean(domain),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const refreshAll = useCallback(() => {
    if (vercelDomainsConfigured) {
      refetchDomain();
      refetchConfig();
      refetchVerification();
    } else {
      refetchSelfHosted();
    }
  }, [
    refetchConfig,
    refetchDomain,
    refetchSelfHosted,
    refetchVerification,
    vercelDomainsConfigured,
  ]);

  let status: DomainVerificationStatusProps = "Valid Configuration";

  if (domainJson?.error?.code === "not_found") {
    // domain not found on Vercel project
    status = "Domain Not Found";

    // unknown error
  } else if (domainJson?.error) {
    status = "Unknown Error";

    // if domain is not verified, we try to verify now
  } else if (!domainJson?.verified) {
    status = "Pending Verification";

    // domain was just verified
    if (verificationJson?.verified) {
      status = "Valid Configuration";
    }
  } else if (configJson?.misconfigured) {
    status = "Invalid Configuration";
  } else {
    status = "Valid Configuration";
  }

  const isLoading = vercelDomainsConfigured
    ? isLoadingDomain ||
      isLoadingConfig ||
      isLoadingVerification ||
      isRefetchingDomain ||
      isRefetchingConfig ||
      isRefetchingVerification
    : isFetchingSelfHosted;

  const steps = {
    dns:
      status === "Valid Configuration" || status === "Pending Verification"
        ? "completed"
        : "active",
    verification:
      status === "Valid Configuration"
        ? "completed"
        : status === "Pending Verification"
          ? "active"
          : // "Invalid Configuration" means DNS is misconfigured but ownership is verified
            status === "Invalid Configuration"
            ? "completed"
            : "upcoming",
    ready: status === "Valid Configuration" ? "completed" : "upcoming",
  } satisfies Record<string, StepCardVariant>;

  return {
    canRefresh:
      vercelDomainsConfigured || Boolean(customDomainCnameTarget && domain),
    managed: vercelDomainsConfigured,
    selfHostedReady: selfHostedReady === true,
    status,
    domainJson,
    steps,
    refresh: refreshAll,
    isLoading,
  };
}
