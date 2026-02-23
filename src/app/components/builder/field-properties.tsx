import { Trash2, Plus } from 'lucide-react';
import { FormField } from '../../types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

interface FieldPropertiesProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
}

export function FieldProperties({ field, onUpdate, onDelete }: FieldPropertiesProps) {
  const hasOptions = ['checkbox', 'radio', 'select'].includes(field.type);
  
  const addOption = () => {
    const options = field.options || [];
    onUpdate({ options: [...options, `Option ${options.length + 1}`] });
  };
  
  const updateOption = (index: number, value: string) => {
    const options = [...(field.options || [])];
    options[index] = value;
    onUpdate({ options });
  };
  
  const removeOption = (index: number) => {
    const options = (field.options || []).filter((_, i) => i !== index);
    onUpdate({ options });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Field Properties</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>
          
          {field.type === 'button' ? (
            <div>
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={field.buttonText || ''}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                placeholder="Submit"
              />
            </div>
          ) : (
            <>
              {!hasOptions && (
                <div>
                  <Label htmlFor="placeholder">Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={field.placeholder || ''}
                    onChange={(e) => onUpdate({ placeholder: e.target.value })}
                    placeholder="Placeholder text"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Label htmlFor="required">Required Field</Label>
                <Switch
                  id="required"
                  checked={field.required || false}
                  onCheckedChange={(checked) => onUpdate({ required: checked })}
                />
              </div>
            </>
          )}
          
          {hasOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {(field.options || []).map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Field
        </Button>
      </div>
    </div>
  );
}
