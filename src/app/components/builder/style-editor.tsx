import { FormStyling } from '../../types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface StyleEditorProps {
  styling: FormStyling;
  headline?: string;
  description?: string;
  onUpdate: (updates: { styling?: Partial<FormStyling>; headline?: string; description?: string }) => void;
}

export function StyleEditor({ styling, headline, description, onUpdate }: StyleEditorProps) {
  const updateStyling = (key: keyof FormStyling, value: string) => {
    onUpdate({ styling: { ...styling, [key]: value } });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Content</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline || ''}
              onChange={(e) => onUpdate({ headline: e.target.value })}
              placeholder="Your headline"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Your description"
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Colors</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="bgColor">Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="bgColor"
                value={styling.backgroundColor}
                onChange={(e) => updateStyling('backgroundColor', e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                value={styling.backgroundColor}
                onChange={(e) => updateStyling('backgroundColor', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="textColor">Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="textColor"
                value={styling.textColor}
                onChange={(e) => updateStyling('textColor', e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                value={styling.textColor}
                onChange={(e) => updateStyling('textColor', e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="buttonColor">Button Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="buttonColor"
                value={styling.buttonColor}
                onChange={(e) => updateStyling('buttonColor', e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                value={styling.buttonColor}
                onChange={(e) => updateStyling('buttonColor', e.target.value)}
                placeholder="#3b82f6"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="buttonTextColor">Button Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="buttonTextColor"
                value={styling.buttonTextColor}
                onChange={(e) => updateStyling('buttonTextColor', e.target.value)}
                className="w-16 h-10 p-1"
              />
              <Input
                value={styling.buttonTextColor}
                onChange={(e) => updateStyling('buttonTextColor', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Border</h3>
        
        <div>
          <Label htmlFor="borderRadius">Border Radius</Label>
          <select
            id="borderRadius"
            value={styling.borderRadius}
            onChange={(e) => updateStyling('borderRadius', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="0px">None</option>
            <option value="4px">Small (4px)</option>
            <option value="8px">Medium (8px)</option>
            <option value="12px">Large (12px)</option>
            <option value="16px">Extra Large (16px)</option>
            <option value="9999px">Full Round</option>
          </select>
        </div>
      </div>
    </div>
  );
}
