const API_BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Analytics
export interface AnalyticsOverviewResponse {
  totals: {
    impressions: number;
    submissions: number;
    conversionRate: number;
    activeCampaigns: number;
  };
  timeseries: Array<{
    date: string;
    impressions: number;
    submissions: number;
    conversionRate: number;
  }>;
  topCampaigns: Array<{
    campaignId: string;
    name: string;
    status: string;
    type: string;
    impressions: number;
    submissions: number;
    conversionRate: number;
  }>;
}

export function fetchAnalyticsOverview(params: {
  siteId?: string;
  range?: string;
}): Promise<AnalyticsOverviewResponse> {
  const searchParams = new URLSearchParams();
  if (params.siteId) searchParams.set('site_id', params.siteId);
  if (params.range) searchParams.set('range', params.range);
  return apiFetch(`/analytics/overview?${searchParams.toString()}`);
}

export interface CampaignAnalyticsResponse {
  campaignId: string;
  campaignName: string;
  totals: {
    impressions: number;
    submissions: number;
    conversionRate: number;
  };
  variants: Array<{
    variantId: string;
    variantName: string;
    impressions: number;
    submissions: number;
    conversionRate: number;
  }>;
  timeseries: Array<{
    variantId: string;
    date: string;
    impressions: number;
    submissions: number;
    conversionRate: number;
  }>;
}

export function fetchCampaignAnalytics(
  campaignId: string,
  params: { range?: string }
): Promise<CampaignAnalyticsResponse> {
  const searchParams = new URLSearchParams();
  if (params.range) searchParams.set('range', params.range);
  return apiFetch(`/analytics/campaign/${campaignId}?${searchParams.toString()}`);
}

// Notifications
export interface NotificationsResponse {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    linkUrl: string | null;
    readAt: string | null;
    createdAt: string;
  }>;
  unreadCount: number;
}

export function fetchNotifications(params?: {
  page?: number;
}): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  return apiFetch(`/notifications?${searchParams.toString()}`);
}

export function markNotificationRead(id: string): Promise<void> {
  return apiFetch(`/notifications/${id}/read`, { method: 'POST' });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiFetch('/notifications/read-all', { method: 'POST' });
}
