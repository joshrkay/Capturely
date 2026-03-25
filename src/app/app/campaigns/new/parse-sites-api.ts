export interface Site {
  id: string;
  name: string;
  primaryDomain: string;
}

export type SitesApiResponse = {
  sites?: Site[];
};

export function parseSitesApiResponse(data: unknown): SitesApiResponse {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid sites payload");
  }

  const payload = data as { sites?: unknown };
  if (payload.sites !== undefined && !Array.isArray(payload.sites)) {
    throw new Error("Invalid sites payload");
  }

  return { sites: payload.sites as Site[] | undefined };
}
