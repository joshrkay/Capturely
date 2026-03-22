/**
 * GrowthBook integration — server-side helpers.
 * GrowthBook handles all traffic splitting, statistical analysis, and winner determination.
 */

const GROWTHBOOK_API_HOST = process.env.GROWTHBOOK_API_HOST ?? "http://localhost:3100";
const GROWTHBOOK_SECRET_KEY = process.env.GROWTHBOOK_SECRET_KEY ?? "";

interface GrowthBookApiResponse<T> {
  data: T;
}

async function gbFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${GROWTHBOOK_API_HOST}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROWTHBOOK_SECRET_KEY}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GrowthBook API error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as GrowthBookApiResponse<T>;
  return json.data;
}

export interface GBExperiment {
  id: string;
  trackingKey: string;
  name: string;
  status: string;
  variations: Array<{ name: string; key: string }>;
  weights: number[];
}

export async function createExperiment(params: {
  trackingKey: string;
  name: string;
  variations: Array<{ name: string; key: string }>;
  weights: number[];
}): Promise<GBExperiment> {
  return gbFetch<GBExperiment>("/experiments", {
    method: "POST",
    body: JSON.stringify({
      trackingKey: params.trackingKey,
      name: params.name,
      variations: params.variations,
      weights: params.weights,
      status: "running",
    }),
  });
}

export async function updateExperiment(
  experimentId: string,
  updates: Partial<{
    status: string;
    weights: number[];
    variations: Array<{ name: string; key: string }>;
  }>
): Promise<GBExperiment> {
  return gbFetch<GBExperiment>(`/experiments/${experimentId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function getExperiment(experimentId: string): Promise<GBExperiment> {
  return gbFetch<GBExperiment>(`/experiments/${experimentId}`);
}

export async function stopExperiment(experimentId: string): Promise<GBExperiment> {
  return updateExperiment(experimentId, { status: "stopped" });
}

export interface GBExperimentResults {
  id: string;
  status: string;
  winner?: string;
  variations: Array<{
    key: string;
    users: number;
    conversionRate: number;
    uplift: number;
    significant: boolean;
  }>;
}

export async function getExperimentResults(experimentId: string): Promise<GBExperimentResults> {
  return gbFetch<GBExperimentResults>(`/experiments/${experimentId}/results`);
}
