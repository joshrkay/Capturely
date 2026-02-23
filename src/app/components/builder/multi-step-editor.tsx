import { useState } from 'react';
import { Plus, GripVertical, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { FormVariant, FormField } from '../../types';
import { generateId } from '../../lib/utils';
import { toast } from 'sonner';

interface MultiStepEditorProps {
  variant: FormVariant;
  onUpdate: (updates: Partial<FormVariant>) => void;
}

export function MultiStepEditor({ variant, onUpdate }: MultiStepEditorProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const multiStep = variant.multiStep || {
    enabled: false,
    steps: []
  };

  const handleEnableMultiStep = () => {
    if (!multiStep.enabled) {
      // Initialize with one step containing all fields
      const allFieldIds = variant.fields.filter(f => f.type !== 'button').map(f => f.id);
      const buttonField = variant.fields.find(f => f.type === 'button');
      
      onUpdate({
        multiStep: {
          enabled: true,
          steps: [
            {
              id: generateId(),
              name: 'Step 1',
              fieldIds: allFieldIds
            }
          ]
        }
      });
      
      // Update fields with step numbers
      const updatedFields = variant.fields.map(f => ({
        ...f,
        stepNumber: f.type === 'button' ? undefined : 1
      }));
      
      onUpdate({ fields: updatedFields });
      toast.success('Multi-step form enabled');
    } else {
      onUpdate({
        multiStep: {
          enabled: false,
          steps: []
        }
      });
      
      // Remove step numbers from fields
      const updatedFields = variant.fields.map(f => ({
        ...f,
        stepNumber: undefined
      }));
      
      onUpdate({ fields: updatedFields });
      toast.success('Multi-step form disabled');
    }
  };

  const handleAddStep = () => {
    const newStep = {
      id: generateId(),
      name: `Step ${multiStep.steps.length + 1}`,
      fieldIds: []
    };
    
    onUpdate({
      multiStep: {
        ...multiStep,
        steps: [...multiStep.steps, newStep]
      }
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (multiStep.steps.length <= 1) {
      toast.error('Must have at least one step');
      return;
    }
    
    onUpdate({
      multiStep: {
        ...multiStep,
        steps: multiStep.steps.filter(s => s.id !== stepId)
      }
    });
    
    toast.success('Step deleted');
  };

  const handleRenameStep = (stepId: string, newName: string) => {
    onUpdate({
      multiStep: {
        ...multiStep,
        steps: multiStep.steps.map(s =>
          s.id === stepId ? { ...s, name: newName } : s
        )
      }
    });
  };

  const handleMoveField = (fieldId: string, targetStepId: string) => {
    // Remove field from all steps
    const updatedSteps = multiStep.steps.map(step => ({
      ...step,
      fieldIds: step.fieldIds.filter(id => id !== fieldId)
    }));
    
    // Add field to target step
    const finalSteps = updatedSteps.map(step =>
      step.id === targetStepId
        ? { ...step, fieldIds: [...step.fieldIds, fieldId] }
        : step
    );
    
    onUpdate({
      multiStep: {
        ...multiStep,
        steps: finalSteps
      }
    });
    
    // Update field step number
    const stepIndex = finalSteps.findIndex(s => s.id === targetStepId);
    const updatedFields = variant.fields.map(f =>
      f.id === fieldId ? { ...f, stepNumber: stepIndex + 1 } : f
    );
    
    onUpdate({ fields: updatedFields });
  };

  const getFieldsInStep = (stepId: string) => {
    const step = multiStep.steps.find(s => s.id === stepId);
    if (!step) return [];
    
    return step.fieldIds
      .map(fieldId => variant.fields.find(f => f.id === fieldId))
      .filter(Boolean) as FormField[];
  };

  const getUnassignedFields = () => {
    const assignedFieldIds = multiStep.steps.flatMap(s => s.fieldIds);
    return variant.fields.filter(
      f => !assignedFieldIds.includes(f.id) && f.type !== 'button'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Multi-Step Form</h3>
        <p className="text-sm text-gray-600">Break your form into multiple steps to improve completion rates</p>
      </div>

      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label className="text-sm font-semibold text-gray-900">Enable Multi-Step</Label>
          <p className="text-xs text-gray-600 mt-1">Convert your form into multiple steps</p>
        </div>
        <button
          onClick={handleEnableMultiStep}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            multiStep.enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              multiStep.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {multiStep.enabled && (
        <div className="space-y-4">
          {/* Steps */}
          {multiStep.steps.map((step, index) => {
            const isExpanded = expandedStep === step.id;
            const fieldsInStep = getFieldsInStep(step.id);
            
            return (
              <Card key={step.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <Input
                        value={step.name}
                        onChange={(e) => handleRenameStep(step.id, e.target.value)}
                        className="font-semibold"
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {fieldsInStep.length} fields
                    </span>
                  </div>
                  {multiStep.steps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStep(step.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {isExpanded && (
                  <div className="space-y-2 pl-8">
                    {fieldsInStep.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        No fields in this step. Drag fields here or select from unassigned fields below.
                      </p>
                    ) : (
                      fieldsInStep.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="text-sm flex-1">{field.label}</span>
                          <span className="text-xs text-gray-500">{field.type}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Add Step Button */}
          <Button
            variant="outline"
            onClick={handleAddStep}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>

          {/* Unassigned Fields */}
          {getUnassignedFields().length > 0 && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Unassigned Fields ({getUnassignedFields().length})
              </h4>
              <div className="space-y-2">
                {getUnassignedFields().map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-2 bg-white rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{field.label}</span>
                      <span className="text-xs text-gray-500">({field.type})</span>
                    </div>
                    <select
                      onChange={(e) => handleMoveField(field.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      defaultValue=""
                    >
                      <option value="" disabled>Assign to step...</option>
                      {multiStep.steps.map((step, idx) => (
                        <option key={step.id} value={step.id}>
                          {step.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
