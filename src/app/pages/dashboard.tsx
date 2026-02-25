import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Play, Pause, Archive, Trash2, TrendingUp, Eye, Mail, FileText, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { getCampaigns, deleteCampaign, saveCampaign, getCampaignAnalytics, initializeSampleData } from '../lib/storage';
import { Campaign, FormVariant } from '../types';
import { formatDate, formatNumber, formatPercentage, generateId } from '../lib/utils';
import { AIFormGenerator } from '../components/ai-form-generator';
import { toast } from 'sonner';

export function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    initializeSampleData();
    loadCampaigns();
  }, []);
  
  const loadCampaigns = () => {
    setCampaigns(getCampaigns());
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
      loadCampaigns();
    }
  };
  
  const handleStatusChange = (campaign: Campaign, newStatus: Campaign['status']) => {
    saveCampaign({ ...campaign, status: newStatus, updatedAt: new Date().toISOString() });
    loadCampaigns();
  };
  
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalViews = campaigns.reduce((sum, c) => {
    const analytics = getCampaignAnalytics(c.id);
    return sum + (analytics?.totalViews || 0);
  }, 0);
  const totalSubmissions = campaigns.reduce((sum, c) => {
    const analytics = getCampaignAnalytics(c.id);
    return sum + (analytics?.totalSubmissions || 0);
  }, 0);
  const avgConversion = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;
  
  const handleAIGenerate = (variant: FormVariant) => {
    // Create a new campaign from the AI-generated variant
    const newCampaign: Campaign = {
      id: generateId(),
      name: variant.headline || 'AI Generated Form',
      type: 'popup',
      status: 'draft',
      variants: [variant],
      displayRules: {
        trigger: 'delay',
        delaySeconds: 3
      },
      spamProtection: {
        enabled: true,
        honeypot: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveCampaign(newCampaign);
    toast.success('Form created! Redirecting to builder...');
    setTimeout(() => {
      router.push(`/builder/${newCampaign.id}`);
    }, 500);
  };
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaigns</h1>
        <p className="text-gray-600">Manage your popup and form campaigns</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{activeCampaigns}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalViews)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totalSubmissions)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(avgConversion)}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">All Campaigns</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAIGenerator(true)}
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
          >
            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
            AI Generate
          </Button>
          <Link href="/templates">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first popup or form from our template library
            </p>
            <Link href="/templates">
              <Button>Browse Templates</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => {
            const analytics = getCampaignAnalytics(campaign.id);
            
            return (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {campaign.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <Badge 
                          variant={campaign.status === 'active' ? 'default' : 'secondary'}
                          className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">{campaign.type}</Badge>
                        {campaign.variants.length > 1 && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            A/B Testing
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Updated {formatDate(campaign.updatedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-8 mr-8">
                    <div>
                      <p className="text-sm text-gray-600">Views</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(analytics?.totalViews || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submissions</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(analytics?.totalSubmissions || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Conversion</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPercentage(analytics?.overallConversionRate || 0)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link href={`/builder/${campaign.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/analytics/${campaign.id}`}>
                      <Button variant="outline" size="sm">Analytics</Button>
                    </Link>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {campaign.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'paused')}>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'active')}>
                            <Play className="w-4 h-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleStatusChange(campaign, 'archived')}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(campaign.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* AI Form Generator Modal */}
      {showAIGenerator && (
        <AIFormGenerator
          onGenerate={handleAIGenerate}
          onCancel={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
}