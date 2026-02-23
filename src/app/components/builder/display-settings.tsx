import { DisplayRules, Campaign } from '../../types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface DisplaySettingsProps {
  displayRules: DisplayRules;
  campaignType: Campaign['type'];
  zapierWebhook?: string;
  onUpdate: (updates: { displayRules?: Partial<DisplayRules>; zapierWebhook?: string }) => void;
}

export function DisplaySettings({ 
  displayRules, 
  campaignType,
  zapierWebhook,
  onUpdate 
}: DisplaySettingsProps) {
  const updateDisplayRules = (key: keyof DisplayRules, value: any) => {
    onUpdate({ displayRules: { ...displayRules, [key]: value } });
  };
  
  return (
    <div className="space-y-6">
      {campaignType === 'popup' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Display Trigger</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="trigger">When to show</Label>
              <select
                id="trigger"
                value={displayRules.trigger}
                onChange={(e) => updateDisplayRules('trigger', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="immediate">Immediately</option>
                <option value="delay">After delay</option>
                <option value="scroll">On scroll</option>
                <option value="exit">Exit intent</option>
              </select>
            </div>
            
            {displayRules.trigger === 'delay' && (
              <div>
                <Label htmlFor="delaySeconds">Delay (seconds)</Label>
                <Input
                  type="number"
                  id="delaySeconds"
                  value={displayRules.delaySeconds || 3}
                  onChange={(e) => updateDisplayRules('delaySeconds', parseInt(e.target.value))}
                  min="0"
                  max="60"
                />
              </div>
            )}
            
            {displayRules.trigger === 'scroll' && (
              <div>
                <Label htmlFor="scrollPercent">Scroll percentage</Label>
                <Input
                  type="number"
                  id="scrollPercent"
                  value={displayRules.scrollPercent || 50}
                  onChange={(e) => updateDisplayRules('scrollPercent', parseInt(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="pt-6 border-t">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Page Targeting</h3>
        
        <div>
          <Label htmlFor="pages">URL Patterns (one per line)</Label>
          <Textarea
            id="pages"
            value={(displayRules.pages || []).join('\n')}
            onChange={(e) => updateDisplayRules('pages', e.target.value.split('\n').filter(p => p.trim()))}
            placeholder="Leave empty for all pages&#10;/product/*&#10;/collection/*"
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            Use * as wildcard. Leave empty to show on all pages.
          </p>
        </div>
      </div>
      
      <div className="pt-6 border-t">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Zapier Integration</h3>
        
        <div>
          <Label htmlFor="zapierWebhook">Webhook URL</Label>
          <Textarea
            id="zapierWebhook"
            value={zapierWebhook || ''}
            onChange={(e) => onUpdate({ zapierWebhook: e.target.value })}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Form submissions will be sent to this webhook URL
          </p>
        </div>
      </div>
      
      <div className="pt-6 border-t">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Installation Code</h4>
          <p className="text-xs text-blue-700 mb-3">
            Add this code to your website to display the form
          </p>
          <div className="bg-white rounded border border-blue-200 p-3">
            <code className="text-xs text-gray-800 break-all">
              {`<script src="https://cdn.formbuilder.app/widget.js"></script>
<script>
  FormBuilder.init({
    campaignId: "campaign_id"
  });
</script>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
