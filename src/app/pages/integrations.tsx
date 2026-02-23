import { useState } from 'react';
import { 
  Plus, 
  Mail, 
  Database, 
  MessageSquare, 
  Zap,
  CheckCircle2,
  Settings,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Integration } from '../types';
import { generateId } from '../lib/utils';
import { toast } from 'sonner';

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      type: 'mailchimp',
      name: 'Mailchimp',
      enabled: true,
      config: { apiKey: 'mc_***************', listId: '1a2b3c4d' },
      createdAt: new Date().toISOString()
    }
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const availableIntegrations = [
    {
      type: 'mailchimp' as const,
      name: 'Mailchimp',
      description: 'Sync submissions to your Mailchimp audience',
      icon: <Mail className="w-6 h-6" />,
      color: 'bg-yellow-500',
      popular: true
    },
    {
      type: 'hubspot' as const,
      name: 'HubSpot',
      description: 'Add contacts directly to HubSpot CRM',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-orange-500',
      popular: true
    },
    {
      type: 'salesforce' as const,
      name: 'Salesforce',
      description: 'Create leads and contacts in Salesforce',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-blue-500',
      popular: false
    },
    {
      type: 'google_sheets' as const,
      name: 'Google Sheets',
      description: 'Send form data to a Google Spreadsheet',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-green-500',
      popular: true
    },
    {
      type: 'slack' as const,
      name: 'Slack',
      description: 'Get real-time notifications in Slack',
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'bg-purple-500',
      popular: true
    },
    {
      type: 'zapier' as const,
      name: 'Zapier',
      description: 'Connect to 5000+ apps via Zapier',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-orange-600',
      popular: false
    },
  ];

  const handleConnect = (type: Integration['type']) => {
    const integration = availableIntegrations.find(i => i.type === type);
    if (!integration) return;

    const newIntegration: Integration = {
      id: generateId(),
      type,
      name: integration.name,
      enabled: false,
      config: {},
      createdAt: new Date().toISOString()
    };
    
    setSelectedIntegration(newIntegration);
    setShowAddModal(true);
  };

  const handleSaveIntegration = () => {
    if (!selectedIntegration) return;
    
    const existing = integrations.find(i => i.id === selectedIntegration.id);
    if (existing) {
      setIntegrations(integrations.map(i => 
        i.id === selectedIntegration.id ? selectedIntegration : i
      ));
      toast.success('Integration updated');
    } else {
      setIntegrations([...integrations, { ...selectedIntegration, enabled: true }]);
      toast.success('Integration connected');
    }
    
    setShowAddModal(false);
    setSelectedIntegration(null);
  };

  const handleDelete = (id: string) => {
    setIntegrations(integrations.filter(i => i.id !== id));
    toast.success('Integration removed');
  };

  const handleToggle = (id: string) => {
    setIntegrations(integrations.map(i => 
      i.id === id ? { ...i, enabled: !i.enabled } : i
    ));
  };

  const getIntegrationDetails = (type: Integration['type']) => {
    return availableIntegrations.find(i => i.type === type);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
        <p className="text-gray-600">
          Connect your forms to your favorite tools and automate your workflow
        </p>
      </div>

      <Tabs defaultValue="connected" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connected">
            Connected ({integrations.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availableIntegrations.length})
          </TabsTrigger>
        </TabsList>

        {/* Connected Integrations */}
        <TabsContent value="connected" className="space-y-4">
          {integrations.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No integrations yet</h3>
              <p className="text-gray-600 mb-6">
                Connect your first integration to start automating your workflow
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => {
                const details = getIntegrationDetails(integration.type);
                if (!details) return null;

                return (
                  <Card key={integration.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${details.color} rounded-xl flex items-center justify-center text-white`}>
                          {details.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-sm text-gray-600">{details.description}</p>
                        </div>
                      </div>
                      {integration.enabled && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowAddModal(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(integration.id)}
                      >
                        {integration.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Available Integrations */}
        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map((integration) => {
              const isConnected = integrations.some(i => i.type === integration.type);
              
              return (
                <Card key={integration.type} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${integration.color} rounded-xl flex items-center justify-center text-white`}>
                      {integration.icon}
                    </div>
                    {integration.popular && (
                      <Badge variant="secondary">Popular</Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                  
                  <Button
                    onClick={() => handleConnect(integration.type)}
                    disabled={isConnected}
                    className="w-full"
                    variant={isConnected ? 'outline' : 'default'}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Integration Configuration Modal */}
      {showAddModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Configure {selectedIntegration.name}
            </h2>

            <div className="space-y-4 mb-6">
              {selectedIntegration.type === 'mailchimp' && (
                <>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter your Mailchimp API key"
                      value={selectedIntegration.config.apiKey || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        config: { ...selectedIntegration.config, apiKey: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Audience ID</Label>
                    <Input
                      placeholder="Enter audience/list ID"
                      value={selectedIntegration.config.listId || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        config: { ...selectedIntegration.config, listId: e.target.value }
                      })}
                    />
                  </div>
                  <a
                    href="https://mailchimp.com/help/about-api-keys/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    How to get your API key <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}

              {selectedIntegration.type === 'slack' && (
                <>
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      placeholder="https://hooks.slack.com/services/..."
                      value={selectedIntegration.config.webhookUrl || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        config: { ...selectedIntegration.config, webhookUrl: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Channel</Label>
                    <Input
                      placeholder="#leads"
                      value={selectedIntegration.config.channel || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        config: { ...selectedIntegration.config, channel: e.target.value }
                      })}
                    />
                  </div>
                </>
              )}

              {['hubspot', 'salesforce', 'google_sheets'].includes(selectedIntegration.type) && (
                <>
                  <div>
                    <Label>API Key / Access Token</Label>
                    <Input
                      type="password"
                      placeholder="Enter your API credentials"
                      value={selectedIntegration.config.apiKey || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        config: { ...selectedIntegration.config, apiKey: e.target.value }
                      })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedIntegration(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveIntegration}>
                Save Integration
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
