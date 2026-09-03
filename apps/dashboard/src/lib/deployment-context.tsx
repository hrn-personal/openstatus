"use client";

import { buildStatusPageUrl } from "@openstatus/utils";
import { createContext, useContext } from "react";

type DeploymentConfig = {
  statusPageBaseUrl: string | null;
  vercelDomainsConfigured: boolean;
};

const DeploymentContext = createContext<DeploymentConfig>({
  statusPageBaseUrl: null,
  vercelDomainsConfigured: true,
});

export function DeploymentProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DeploymentConfig;
}) {
  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeploymentConfig() {
  return useContext(DeploymentContext);
}

export function useStatusPageUrl(slug: string, customDomain?: string | null) {
  const { statusPageBaseUrl } = useDeploymentConfig();
  return buildStatusPageUrl({ slug, customDomain, baseUrl: statusPageBaseUrl });
}
