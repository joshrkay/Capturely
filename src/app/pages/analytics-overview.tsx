import { useState, useEffect } from 'react';
import { Link } from 'react-router';
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
import { getCampaigns, getAllAnalytics } from '../lib/storage';
import { formatNumber, formatPercentage } from '../lib/utils';

export function AnalyticsOverview() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [allAnalytics, setAllAnalytics] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days');
  const [sortBy, setSortBy] = useState<'views' | 'submissions' | 'conversion'>('views');
  
  useEffect(() => {
    const c = getCampaigns();
    const analytics = getAllAnalytics();
    setCampaigns(c || []);
    setAllAnalytics(analytics || []);
  }, []);
  
  // Calculate aggregate stats
  const totalViews = (allAnalytics || []).reduce((sum, a) => sum + (a?.totalViews || 0), 0);
  const totalSubmissions = (allAnalytics || []).reduce((sum, a) => sum + (a?.totalSubmissions || 0), 0);
  const overallConversionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;
  
  // Get active campaigns count
  const activeCampaigns = (campaigns || []).filter(c => c.status === 'active').length;
  
  // Create campaign performance data
  const campaignPerformance = (campaigns || []).map(campaign => {
    const analytics = (allAnalytics || []).find(a => a.campaignId === campaign.id);
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      views: analytics?.totalViews || 0,
      submissions: analytics?.totalSubmissions || 0,
      conversionRate: analytics?.overallConversionRate || 0,
      topVariant: analytics?.variants?.[0]?.variantName || 'N/A',
      type: campaign.type,
    };
  }).sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.views - a.views;
      case 'submissions':
        return b.submissions - a.submissions;
      case 'conversion':
        return b.conversionRate - a.conversionRate;
      default:
        return 0;
    }
  });
  
  // Generate mock time series data for trend chart
  const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
  const trendData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (Math.min(days, 30) - 1 - i));
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: Math.floor(Math.random() * 200) + 100,
      submissions: Math.floor(Math.random() * 40) + 10,
    };
  });
  
  // Top performing campaigns for chart
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
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
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
                {campaigns.length} total
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
        
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first campaign to start seeing analytics
              </p>
              <Link to="/templates">
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
                        to={`/analytics/${campaign.id}`}
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
                      <Link to={`/analytics/${campaign.id}`}>
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