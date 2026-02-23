import { ArrowLeft, TrendingUp, Eye, Mail, Trophy } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCampaign, getCampaignAnalytics } from '../lib/storage';
import { formatNumber, formatPercentage } from '../lib/utils';
import { useParams, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { StatisticalSignificance } from '../components/statistical-significance';

export function Analytics() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');
  
  useEffect(() => {
    if (id) {
      const c = getCampaign(id);
      const a = getCampaignAnalytics(id);
      setCampaign(c);
      setAnalytics(a);
    }
  }, [id]);
  
  if (!campaign || !analytics) {
    return (
      <div className="p-8">
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
  
  // Generate mock time series data based on selected time range
  const days = timeRange === '7days' ? 7 : 30;
  const timeSeriesData = Array.from({ length: days }, (_, i) => {
    const dataPoint: any = {
      day: timeRange === '7days' ? `Day ${i + 1}` : `${i + 1}`,
    };
    
    // Add data for each variant
    analytics.variants.forEach((variant: any, index: number) => {
      const variantKey = variant.variantName.replace(/\s+/g, '');
      dataPoint[variantKey] = Math.floor(Math.random() * 30) + 10;
    });
    
    return dataPoint;
  });
  
  const variantData = analytics.variants.map((v: any) => ({
    name: v.variantName,
    views: v.views,
    submissions: v.submissions,
    conversion: v.conversionRate,
  }));
  
  // Restructure data for grouped bar chart
  const variantComparisonData = [
    {
      metric: 'Views',
      ...analytics.variants.reduce((acc: any, variant: any) => {
        acc[variant.variantName] = variant.views;
        return acc;
      }, {})
    },
    {
      metric: 'Submissions',
      ...analytics.variants.reduce((acc: any, variant: any) => {
        acc[variant.variantName] = variant.submissions;
        return acc;
      }, {})
    }
  ];
  
  const winner = analytics.variants.reduce((best: any, current: any) => 
    current.conversionRate > best.conversionRate ? current : best
  );
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/analytics" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Analytics Overview
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
            <p className="text-gray-600">Campaign Analytics</p>
          </div>
          
          <div className="flex gap-2">
            <Link to={`/builder/${id}`}>
              <Button variant="outline">Edit Campaign</Button>
            </Link>
            <Link to={`/submissions/${id}`}>
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
                {formatNumber(analytics.totalViews)}
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
                {formatNumber(analytics.totalSubmissions)}
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
                {formatPercentage(analytics.overallConversionRate)}
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
                {winner.variantName}
              </p>
              <p className="text-xs text-gray-600">
                {formatPercentage(winner.conversionRate)} CR
              </p>
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
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as '7days' | '30days')}>
              <TabsList>
                <TabsTrigger value="7days">Last 7 Days</TabsTrigger>
                <TabsTrigger value="30days">Last 30 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              {analytics.variants.map((variant: any, index: number) => {
                const variantKey = variant.variantName.replace(/\s+/g, '');
                return (
                  <Bar
                    key={variantKey}
                    dataKey={variantKey}
                    fill={variantColors[index % variantColors.length]}
                    name={variant.variantName}
                  />
                );
              })}
            </BarChart>
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
              {analytics.variants.map((variant: any, index: number) => (
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
      {campaign.variants.length > 1 && (
        <div className="mb-8">
          <StatisticalSignificance
            variants={analytics.variants}
            totalViews={analytics.totalViews}
          />
        </div>
      )}
      
      {/* Variant Comparison */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            A/B Test Results
          </h3>
          {campaign.variants.length > 1 && (
            <Badge className="bg-purple-100 text-purple-700">
              {campaign.variants.length} Variants Active
            </Badge>
          )}
        </div>
        
        <div className="space-y-4">
          {analytics.variants.map((variant: any) => {
            const isWinner = variant.variantId === winner.variantId;
            
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
                      {formatPercentage((variant.views / analytics.totalViews) * 100)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {campaign.variants.length > 1 && (
          <StatisticalSignificance
            totalViews={analytics.totalViews}
            winner={winner}
            onPromoteWinner={() => {
              // Add logic to promote the winner
            }}
          />
        )}
      </Card>
    </div>
  );
}