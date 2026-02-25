import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Eye, Mail, Trophy, BarChart3, ArrowUpRight, Calendar } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatNumber, formatPercentage } from '../lib/utils';
import { fetchAnalyticsOverview, type AnalyticsOverviewResponse } from '@/lib/api-client';
import { Skeleton } from '../components/ui/skeleton';

export function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [sortBy, setSortBy] = useState<'views' | 'submissions' | 'conversion'>('views');

  useEffect(() => {
    setLoading(true);
    fetchAnalyticsOverview({ range: timeRange })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [timeRange]);

  const totalViews = data?.totals.impressions ?? 0;
  const totalSubmissions = data?.totals.submissions ?? 0;
  const overallConversionRate = data?.totals.conversionRate ?? 0;
  const activeCampaigns = data?.totals.activeCampaigns ?? 0;

  const campaignPerformance = (data?.topCampaigns ?? [])
    .map(c => ({
      id: c.campaignId,
      name: c.name,
      status: c.status,
      views: c.impressions,
      submissions: c.submissions,
      conversionRate: c.conversionRate,
      topVariant: 'N/A',
      type: c.type,
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case 'views': return b.views - a.views;
        case 'submissions': return b.submissions - a.submissions;
        case 'conversion': return b.conversionRate - a.conversionRate;
        default: return 0;
      }
    });

  const trendData = (data?.timeseries ?? []).map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: t.impressions,
    submissions: t.submissions,
  }));

  const topCampaignsData = campaignPerformance.slice(0, 5).map(c => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    views: c.views,
    submissions: c.submissions,
    conversionRate: c.conversionRate,
  }));
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Overview</h1>
            <p className="text-gray-600">Performance metrics across all campaigns</p>
          </div>
          
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeCampaigns}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {campaignPerformance.length} total
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalViews)}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% vs last period
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
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalSubmissions)}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8% vs last period
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(overallConversionRate)}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3.2% vs last period
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Views"
              />
              <Line 
                type="monotone" 
                dataKey="submissions" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Submissions"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 Campaigns by Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCampaignsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#8b5cf6" name="Views" />
              <Bar dataKey="submissions" fill="#10b981" name="Submissions" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Campaign Performance Table */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
              <p className="text-sm text-gray-600 mt-1">Click on any campaign to view detailed analytics</p>
            </div>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="views">Sort by Views</SelectItem>
                <SelectItem value="submissions">Sort by Submissions</SelectItem>
                <SelectItem value="conversion">Sort by Conversion Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {campaignPerformance.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first campaign to start seeing analytics
              </p>
              <Link href="/templates">
                <Button>Create Campaign</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Conversion Rate</TableHead>
                  <TableHead className="text-right">Top Variant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignPerformance.map((campaign) => (
                  <TableRow 
                    key={campaign.id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/analytics/${campaign.id}`}
                        className="hover:text-purple-600 flex items-center gap-2"
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {campaign.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          campaign.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : campaign.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(campaign.views)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(campaign.submissions)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${
                        campaign.conversionRate > 15 
                          ? 'text-green-600' 
                          : campaign.conversionRate > 10 
                          ? 'text-orange-600' 
                          : 'text-gray-600'
                      }`}>
                        {formatPercentage(campaign.conversionRate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {campaign.topVariant}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/analytics/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}