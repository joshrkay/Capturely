import { Plus, Copy, Trash2, Crown } from 'lucide-react';
import { FormVariant } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

interface VariantManagerProps {
  variants: FormVariant[];
  selectedVariantId: string;
  onSelectVariant: (id: string) => void;
  onAddVariant: () => void;
  onDuplicateVariant: (id: string) => void;
  onDeleteVariant: (id: string) => void;
}

export function VariantManager({
  variants,
  selectedVariantId,
  onSelectVariant,
  onAddVariant,
  onDuplicateVariant,
  onDeleteVariant
}: VariantManagerProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">A/B Test Variants</h3>
        <p className="text-xs text-gray-600">
          Test different versions to optimize conversion
        </p>
      </div>
      
      <div className="space-y-2 mb-4">
        {variants.map((variant) => (
          <div
            key={variant.id}
            onClick={() => onSelectVariant(variant.id)}
            className={cn(
              "p-3 border rounded-lg cursor-pointer transition-all",
              variant.id === selectedVariantId
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-gray-900">
                  {variant.name}
                </h4>
                {variant.isControl && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Control
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mb-2">
              {variant.fields.length} fields
            </p>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateVariant(variant.id);
                }}
                className="h-7 text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Button>
              
              {!variant.isControl && variants.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteVariant(variant.id);
                  }}
                  className="h-7 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onAddVariant}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant
      </Button>
      
      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-xs text-purple-900 font-medium mb-1">
          💡 A/B Testing Tip
        </p>
        <p className="text-xs text-purple-700">
          Create variants to test different headlines, CTAs, or form fields. 
          Traffic will be split evenly.
        </p>
      </div>
    </div>
  );
}
