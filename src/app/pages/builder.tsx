import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Settings as SettingsIcon,
  Copy,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getCampaign, saveCampaign } from '../lib/storage';
import { Campaign, FormVariant } from '../types';
import { FormCanvas } from '../components/builder/form-canvas';
import { FieldPalette } from '../components/builder/field-palette';
import { FieldProperties } from '../components/builder/field-properties';
import { StyleEditor } from '../components/builder/style-editor';
import { DisplaySettings } from '../components/builder/display-settings';
import { VariantManager } from '../components/builder/variant-manager';
import { FormPreview } from '../components/builder/form-preview';
import { generateId } from '../lib/utils';
import { toast } from 'sonner';

export function Builder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  
  useEffect(() => {
    if (id) {
      const c = getCampaign(id);
      if (c) {
        setCampaign(c);
        setSelectedVariantId(c.variants[0]?.id || '');
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);
  
  const selectedVariant = campaign?.variants.find(v => v.id === selectedVariantId);
  const selectedField = selectedVariant?.fields.find(f => f.id === selectedFieldId);
  
  const handleSave = () => {
    if (campaign) {
      saveCampaign({ ...campaign, updatedAt: new Date().toISOString() });
      toast.success('Campaign saved successfully');
    }
  };
  
  const handlePublish = () => {
    if (campaign) {
      saveCampaign({ 
        ...campaign, 
        status: 'active',
        updatedAt: new Date().toISOString() 
      });
      toast.success('Campaign published!');
      navigate('/');
    }
  };
  
  const updateCampaign = (updates: Partial<Campaign>) => {
    if (campaign) {
      setCampaign({ ...campaign, ...updates });
    }
  };
  
  const updateVariant = (variantId: string, updates: Partial<FormVariant>) => {
    if (campaign) {
      const updatedVariants = campaign.variants.map(v =>
        v.id === variantId ? { ...v, ...updates } : v
      );
      setCampaign({ ...campaign, variants: updatedVariants });
    }
  };
  
  const addVariant = () => {
    if (campaign && selectedVariant) {
      const newVariant: FormVariant = {
        ...selectedVariant,
        id: generateId(),
        name: `Variant ${campaign.variants.length + 1}`,
        isControl: false
      };
      
      setCampaign({
        ...campaign,
        variants: [...campaign.variants, newVariant]
      });
      setSelectedVariantId(newVariant.id);
      toast.success('New variant created');
    }
  };
  
  const duplicateVariant = (variantId: string) => {
    if (campaign) {
      const variant = campaign.variants.find(v => v.id === variantId);
      if (variant) {
        const newVariant: FormVariant = {
          ...variant,
          id: generateId(),
          name: `${variant.name} (Copy)`,
          isControl: false
        };
        
        setCampaign({
          ...campaign,
          variants: [...campaign.variants, newVariant]
        });
        toast.success('Variant duplicated');
      }
    }
  };
  
  const deleteVariant = (variantId: string) => {
    if (campaign && campaign.variants.length > 1) {
      const updatedVariants = campaign.variants.filter(v => v.id !== variantId);
      setCampaign({ ...campaign, variants: updatedVariants });
      
      if (selectedVariantId === variantId) {
        setSelectedVariantId(updatedVariants[0]?.id || '');
      }
      
      toast.success('Variant deleted');
    }
  };
  
  if (!campaign || !selectedVariant) {
    return <div className="p-8">Loading...</div>;
  }
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              
              <div>
                <Input
                  value={campaign.name}
                  onChange={(e) => updateCampaign({ name: e.target.value })}
                  className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
                />
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{campaign.type}</Badge>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handlePublish}>
                Publish
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <Tabs defaultValue="fields" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
              </TabsList>
              
              <TabsContent value="fields" className="p-4">
                <FieldPalette />
              </TabsContent>
              
              <TabsContent value="variants" className="p-4">
                <VariantManager
                  variants={campaign.variants}
                  selectedVariantId={selectedVariantId}
                  onSelectVariant={setSelectedVariantId}
                  onAddVariant={addVariant}
                  onDuplicateVariant={duplicateVariant}
                  onDeleteVariant={deleteVariant}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Canvas */}
          <div className="flex-1 overflow-y-auto p-8">
            <FormCanvas
              variant={selectedVariant}
              campaignType={campaign.type}
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              onUpdateVariant={(updates) => updateVariant(selectedVariantId, updates)}
            />
          </div>
          
          {/* Right Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="properties">Field</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="p-4">
                {selectedField ? (
                  <FieldProperties
                    field={selectedField}
                    onUpdate={(updates) => {
                      const updatedFields = selectedVariant.fields.map(f =>
                        f.id === selectedFieldId ? { ...f, ...updates } : f
                      );
                      updateVariant(selectedVariantId, { fields: updatedFields });
                    }}
                    onDelete={() => {
                      const updatedFields = selectedVariant.fields.filter(f => f.id !== selectedFieldId);
                      updateVariant(selectedVariantId, { fields: updatedFields });
                      setSelectedFieldId('');
                      toast.success('Field deleted');
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Select a field to edit its properties
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="style" className="p-4">
                <StyleEditor
                  styling={selectedVariant.styling}
                  headline={selectedVariant.headline}
                  description={selectedVariant.description}
                  onUpdate={(updates) => updateVariant(selectedVariantId, updates)}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="p-4">
                <DisplaySettings
                  displayRules={campaign.displayRules}
                  campaignType={campaign.type}
                  zapierWebhook={campaign.zapierWebhook}
                  onUpdate={(updates) => updateCampaign(updates)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreview && (
        <FormPreview
          variant={selectedVariant}
          campaignType={campaign.type}
          onClose={() => setShowPreview(false)}
        />
      )}
    </DndProvider>
  );
}
