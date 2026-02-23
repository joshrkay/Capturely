import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { templates } from '../lib/templates';
import { Template, Campaign } from '../types';
import { generateId } from '../lib/utils';
import { saveCampaign } from '../lib/storage';

export function Templates() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'newsletter', label: 'Newsletter' },
    { id: 'discount', label: 'Discount' },
    { id: 'contact', label: 'Contact' },
    { id: 'quote', label: 'Quote' },
    { id: 'appointment', label: 'Appointment' },
    { id: 'support', label: 'Support' },
    { id: 'waitlist', label: 'Waitlist' },
    { id: 'wholesale', label: 'Wholesale' },
  ];
  
  const filteredTemplates = (category: string) => {
    let filtered = category === 'all' ? templates : templates.filter(t => t.category === category);
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const handleCreateFromTemplate = (template: Template) => {
    const campaign: Campaign = {
      id: generateId(),
      name: template.name,
      type: template.type,
      status: 'draft',
      variants: [
        {
          ...template.variant,
          id: generateId(),
          isControl: true,
        }
      ],
      displayRules: {
        trigger: template.type === 'popup' ? 'delay' : 'immediate',
        delaySeconds: 3
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveCampaign(campaign);
    navigate(`/builder/${campaign.id}`);
  };
  
  const handleCreateBlank = () => {
    const campaign: Campaign = {
      id: generateId(),
      name: 'New Campaign',
      type: 'popup',
      status: 'draft',
      variants: [
        {
          id: generateId(),
          name: 'Control',
          isControl: true,
          headline: 'Your Headline Here',
          description: 'Add your description',
          fields: [
            {
              id: generateId(),
              type: 'email',
              label: 'Email Address',
              placeholder: 'you@example.com',
              required: true
            },
            {
              id: generateId(),
              type: 'button',
              label: 'Submit',
              buttonText: 'Submit'
            }
          ],
          styling: {
            backgroundColor: '#ffffff',
            textColor: '#111827',
            buttonColor: '#3b82f6',
            buttonTextColor: '#ffffff',
            borderRadius: '8px',
            fontFamily: 'system-ui'
          }
        }
      ],
      displayRules: {
        trigger: 'delay',
        delaySeconds: 3
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    saveCampaign(campaign);
    navigate(`/builder/${campaign.id}`);
  };
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Template</h1>
            <p className="text-gray-600">Start with a professionally designed template or create from scratch</p>
          </div>
          
          <Button onClick={handleCreateBlank} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Start from Blank
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Templates Grid */}
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid grid-cols-3 gap-6">
              {filteredTemplates(category.id).map(template => (
                <Card 
                  key={template.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  {/* Template Preview */}
                  <div 
                    className="h-64 p-8 flex flex-col justify-center items-center"
                    style={{ 
                      backgroundColor: template.variant.styling.backgroundColor,
                      color: template.variant.styling.textColor
                    }}
                  >
                    <div className="text-center max-w-sm">
                      <h3 className="text-2xl font-bold mb-2">{template.variant.headline}</h3>
                      <p className="text-sm mb-4 opacity-80">{template.variant.description}</p>
                      
                      {/* Sample Fields */}
                      <div className="space-y-2">
                        {template.variant.fields.slice(0, 2).map(field => (
                          <div key={field.id}>
                            {field.type === 'button' ? (
                              <div
                                className="w-full py-2 px-4 rounded font-medium text-sm"
                                style={{
                                  backgroundColor: template.variant.styling.buttonColor,
                                  color: template.variant.styling.buttonTextColor,
                                  borderRadius: template.variant.styling.borderRadius
                                }}
                              >
                                {field.buttonText}
                              </div>
                            ) : (
                              <div 
                                className="w-full py-2 px-4 text-left text-sm bg-white bg-opacity-50 border"
                                style={{ borderRadius: template.variant.styling.borderRadius }}
                              >
                                {field.placeholder || field.label}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Template Info */}
                  <div className="p-4 bg-white border-t">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    
                    <Button 
                      className="w-full group-hover:bg-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFromTemplate(template);
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {filteredTemplates(category.id).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No templates found</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
