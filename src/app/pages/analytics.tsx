import { ArrowLeft, TrendingUp, Eye, Mail, Trophy } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber, formatPercentage } from '../lib/utils';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { StatisticalSignificance } from '../components/statistical-significance';
import { fetchCampaignAnalytics, type CampaignAnalyticsResponse } from '@/lib/api-client';
import { Skeleton } from '../components/ui/skeleton';

export function Analytics() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CampaignAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchCampaignAnalytics(id, { range: timeRange })
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [id, timeRange]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <Link href="/analytics" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Analytics Overview
        </Link>
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Define variant colors for consistent use across charts
  const variantColors = [
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#f59e0b', // Orange
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ];

  // Map API variants to the format used by StatisticalSignificance & UI
  const variants = data.variants.map(v => ({
    variantId: v.variantId,
    variantName: v.variantName,
    views: v.impressions,
    submissions: v.submissions,
    conversionRate: v.conversionRate,
  }));

  // Build real timeseries data grouped by date with per-variant columns
  const dateMap = new Map<string, Record<string, number>>();
  for (const t of data.timeseries) {
    const dateLabel = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dateMap.has(dateLabel)) {
      dateMap.set(dateLabel, { date: 0 } as any);
    }
    const entry = dateMap.get(dateLabel)!;
    const variantInfo = data.variants.find(v => v.variantId === t.variantId);
    const variantKey = (variantInfo?.variantName ?? t.variantId).replace(/\s+/g, '');
    entry[variantKey] = (entry[variantKey] ?? 0) + t.submissions;
  }
  const timeSeriesData = Array.from(dateMap.entries()).map(([date, values]) => ({
    date,
    ...values,
  }));

  // Restructure data for grouped bar chart
  const variantComparisonData = [
    {
      metric: 'Views',
      ...variants.reduce((acc: any, v) => {
        acc[v.variantName] = v.views;
        return acc;
      }, {}),
    },
    {
      metric: 'Submissions',
      ...variants.reduce((acc: any, v) => {
        acc[v.variantName] = v.submissions;
        return acc;
      }, {}),
    },
  ];

  const totalViews = data.totals.impressions;
  const totalSubmissions = data.totals.submissions;
  const overallConversionRate = data.totals.conversionRate;

  const winner = variants.length > 0
    ? variants.reduce((best, current) =>
        current.conversionRate > best.conversionRate ? current : best
      )
    : null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/analytics" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Analytics Overview
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.campaignName}</h1>
            <p className="text-gray-600">Campaign Analytics</p>
          </div>

          <div className="flex gap-2">
            <Link href={`/builder/${id}`}>
              <Button variant="outline">Edit Campaign</Button>
            </Link>
            <Link href={`/submissions/${id}`}>
              <Button variant="outline">View Submissions</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalViews)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Submissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalSubmissions)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(overallConversionRate)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Variant</p>
              <p className="text-lg font-bold text-gray-900">
                {winner?.variantName ?? 'N/A'}
              </p>
              {winner && (
                <p className="text-xs text-gray-600">
                  {formatPercentage(winner.conversionRate)} CR
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Over Time
            </h3>
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as '7d' | '30d')}>
              <TabsList>
                <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
                <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {variants.map((variant, index) => {
                const variantKey = variant.variantName.replace(/\s+/g, '');
                return (
                  <Line
                    key={variantKey}
                    type="monotone"
                    dataKey={variantKey}
                    stroke={variantColors[index % variantColors.length]}
                    strokeWidth={2}
                    name={variant.variantName}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Variant Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={variantComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              {variants.map((variant, index) => (
                <Bar
                  key={variant.variantId}
                  dataKey={variant.variantName}
                  fill={variantColors[index % variantColors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Statistical Significance - Show only if A/B testing */}
      {variants.length > 1 && (
        <div className="mb-8">
          <StatisticalSignificance
            variants={variants}
            totalViews={totalViews}
          />
        </div>
      )}

      {/* Variant Comparison */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            A/B Test Results
          </h3>
          {variants.length > 1 && (
            <Badge className="bg-purple-100 text-purple-700">
              {variants.length} Variants Active
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {variants.map((variant) => {
            const isWinner = winner && variant.variantId === winner.variantId;

            return (
              <div
                key={variant.variantId}
                className={`p-4 rounded-lg border-2 ${
                  isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{variant.variantName}</h4>
                    {isWinner && (
                      <Badge className="bg-yellow-400 text-yellow-900">
                        <Trophy className="w-3 h-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(variant.conversionRate)}
                    </p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Views</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(variant.views)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submissions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(variant.submissions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Traffic Split</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalViews > 0
                        ? formatPercentage((variant.views / totalViews) * 100)
                        : '0%'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {variants.length > 1 && (
          <div className="mt-6">
            <StatisticalSignificance
              variants={variants}
              totalViews={totalViews}
            />
          </div>
        )}
      </Card>
    </div>
  );
}