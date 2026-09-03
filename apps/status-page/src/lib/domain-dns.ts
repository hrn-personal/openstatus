import {
  resolve4 as nodeResolve4,
  resolve6 as nodeResolve6,
  resolveCname as nodeResolveCname,
} from "node:dns/promises";

import { normalizeCaddyDomain } from "./caddy-domain";

type DnsResolver = {
  resolve4: (hostname: string) => Promise<string[]>;
  resolve6: (hostname: string) => Promise<string[]>;
  resolveCname: (hostname: string) => Promise<string[]>;
};

const nodeResolver: DnsResolver = {
  resolve4: nodeResolve4,
  resolve6: nodeResolve6,
  resolveCname: nodeResolveCname,
};

async function resolveOrEmpty(
  lookup: (hostname: string) => Promise<string[]>,
  hostname: string,
) {
  try {
    return await lookup(hostname);
  } catch {
    return [];
  }
}

export async function domainPointsToTarget(
  domainInput: string,
  targetInput: string,
  resolver: DnsResolver = nodeResolver,
) {
  const domain = normalizeCaddyDomain(domainInput);
  const target = normalizeCaddyDomain(targetInput);
  if (!domain || !target || domain === target) return false;

  const cnames = await resolveOrEmpty(resolver.resolveCname, domain);
  if (cnames.some((value) => normalizeCaddyDomain(value) === target)) {
    return true;
  }

  const [domain4, domain6, target4, target6] = await Promise.all([
    resolveOrEmpty(resolver.resolve4, domain),
    resolveOrEmpty(resolver.resolve6, domain),
    resolveOrEmpty(resolver.resolve4, target),
    resolveOrEmpty(resolver.resolve6, target),
  ]);
  const targetAddresses = new Set([...target4, ...target6]);
  return [...domain4, ...domain6].some((address) =>
    targetAddresses.has(address),
  );
}
