import { useDrop, useDrag } from 'react-dnd';
import { GripVertical, Trash2 } from 'lucide-react';
import { FormVariant, FormField, FieldType } from '../../types';
import { generateId } from '../../lib/utils';
import { cn } from '../ui/utils';
import { useRef } from 'react';

interface FormCanvasProps {
  variant: FormVariant;
  campaignType: 'popup' | 'inline';
  selectedFieldId: string;
  onSelectField: (id: string) => void;
  onUpdateVariant: (updates: Partial<FormVariant>) => void;
}

interface DraggableFieldItemProps {
  field: FormField;
  index: number;
  isSelected: boolean;
  variant: FormVariant;
  onSelectField: (id: string) => void;
  onMoveField: (dragIndex: number, hoverIndex: number) => void;
  onDeleteField: (id: string) => void;
}

function DraggableFieldItem({
  field,
  index,
  isSelected,
  variant,
  onSelectField,
  onMoveField,
  onDeleteField,
}: DraggableFieldItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'FIELD_REORDER',
    item: { id: field.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'FIELD_REORDER',
    hover: (item: { id: string; index: number }, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMoveField(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  const baseInputClass = "w-full px-4 py-2 border rounded pointer-events-none";

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onSelectField(field.id);
      }}
      className={cn(
        "relative group cursor-pointer p-3 rounded-lg transition-all",
        isSelected 
          ? "bg-blue-50 border-2 border-blue-500 shadow-sm" 
          : "hover:bg-gray-50 border-2 border-transparent",
        isDragging && "opacity-30 scale-95",
        isOver && "border-t-4 border-t-blue-500 border-b-4 border-b-blue-500"
      )}
    >
      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-100 opacity-20 rounded-lg pointer-events-none" />
      )}
      
      <div className="flex items-start gap-2">
        <div 
          className="cursor-grab active:cursor-grabbing mt-2 hover:bg-gray-200 rounded p-0.5 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 flex-shrink-0" />
        </div>
        
        <div className="flex-1 min-w-0">
          {field.type === 'button' ? (
            <button
              type="button"
              className="w-full py-3 px-6 rounded font-semibold transition-colors pointer-events-none"
              style={{
                backgroundColor: variant.styling.buttonColor,
                color: variant.styling.buttonTextColor,
                borderRadius: variant.styling.borderRadius
              }}
            >
              {field.buttonText || 'Submit'}
            </button>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: variant.styling.textColor }}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder}
                  className={baseInputClass}
                  rows={4}
                  style={{ borderRadius: variant.styling.borderRadius }}
                />
              ) : field.type === 'select' ? (
                <select
                  className={baseInputClass}
                  style={{ borderRadius: variant.styling.borderRadius }}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options?.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div className="space-y-2">
                  {field.options?.map((opt, i) => (
                    <label key={i} className="flex items-center gap-2">
                      <input type="checkbox" className="rounded pointer-events-none" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'radio' ? (
                <div className="space-y-2">
                  {field.options?.map((opt, i) => (
                    <label key={i} className="flex items-center gap-2">
                      <input type="radio" name={field.id} className="pointer-events-none" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className={baseInputClass}
                  style={{ borderRadius: variant.styling.borderRadius }}
                />
              )}
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteField(field.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded text-red-600 mt-2"
          title="Delete field"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function FormCanvas({ 
  variant, 
  campaignType, 
  selectedFieldId, 
  onSelectField,
  onUpdateVariant 
}: FormCanvasProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FIELD',
    drop: (item: { fieldType: FieldType }) => {
      addField(item.fieldType);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));
  
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: getDefaultLabel(type),
      placeholder: getDefaultPlaceholder(type),
      required: type !== 'button',
      ...(type === 'button' && { buttonText: 'Submit' }),
      ...(['checkbox', 'radio', 'select'].includes(type) && {
        options: ['Option 1', 'Option 2', 'Option 3']
      })
    };
    
    onUpdateVariant({ fields: [...variant.fields, newField] });
  };

  const moveField = (dragIndex: number, hoverIndex: number) => {
    const newFields = [...variant.fields];
    const [removed] = newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, removed);
    onUpdateVariant({ fields: newFields });
  };

  const deleteField = (id: string) => {
    const newFields = variant.fields.filter(f => f.id !== id);
    onUpdateVariant({ fields: newFields });
    if (selectedFieldId === id) {
      onSelectField('');
    }
  };
  
  const getDefaultLabel = (type: FieldType): string => {
    const labels: Record<FieldType, string> = {
      text: 'Text Input',
      email: 'Email Address',
      phone: 'Phone Number',
      textarea: 'Message',
      checkbox: 'Options',
      radio: 'Choose One',
      select: 'Select',
      button: 'Submit'
    };
    return labels[type];
  };
  
  const getDefaultPlaceholder = (type: FieldType): string => {
    const placeholders: Record<FieldType, string> = {
      text: 'Enter text',
      email: 'you@example.com',
      phone: '(555) 123-4567',
      textarea: 'Type your message...',
      checkbox: '',
      radio: '',
      select: 'Select an option',
      button: ''
    };
    return placeholders[type];
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Form Preview */}
      <div 
        ref={drop}
        className={cn(
          "rounded-xl shadow-2xl overflow-hidden transition-all",
          campaignType === 'popup' ? 'max-w-md mx-auto' : 'w-full',
          isOver && 'ring-4 ring-blue-400 ring-opacity-50'
        )}
        style={{ 
          backgroundColor: variant.styling.backgroundColor,
          color: variant.styling.textColor 
        }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 
              className="text-2xl font-bold mb-2"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdateVariant({ headline: e.currentTarget.textContent || '' })}
            >
              {variant.headline}
            </h2>
            <p 
              className="opacity-80"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdateVariant({ description: e.currentTarget.textContent || '' })}
            >
              {variant.description}
            </p>
          </div>
          
          {/* Fields */}
          <div className="space-y-4">
            {variant.fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">
                  Drag fields here to build your form
                </p>
              </div>
            ) : (
              variant.fields.map((field, index) => (
                <DraggableFieldItem
                  key={field.id}
                  field={field}
                  index={index}
                  isSelected={field.id === selectedFieldId}
                  variant={variant}
                  onSelectField={onSelectField}
                  onMoveField={moveField}
                  onDeleteField={deleteField}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        {campaignType === 'popup' ? 'Popup Preview' : 'Inline Form Preview'}
      </div>
    </div>
  );
}