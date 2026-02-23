import { useDrag } from 'react-dnd';
import { 
  Type, 
  Mail, 
  Phone, 
  AlignLeft, 
  CheckSquare, 
  Circle, 
  List,
  MousePointerClick 
} from 'lucide-react';
import { FieldType } from '../../types';

interface FieldTypeInfo {
  type: FieldType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const fieldTypes: FieldTypeInfo[] = [
  { 
    type: 'text', 
    icon: Type, 
    label: 'Text Input',
    description: 'Single line text field'
  },
  { 
    type: 'email', 
    icon: Mail, 
    label: 'Email',
    description: 'Email address input'
  },
  { 
    type: 'phone', 
    icon: Phone, 
    label: 'Phone',
    description: 'Phone number input'
  },
  { 
    type: 'textarea', 
    icon: AlignLeft, 
    label: 'Text Area',
    description: 'Multi-line text field'
  },
  { 
    type: 'checkbox', 
    icon: CheckSquare, 
    label: 'Checkbox',
    description: 'Multiple choice options'
  },
  { 
    type: 'radio', 
    icon: Circle, 
    label: 'Radio',
    description: 'Single choice options'
  },
  { 
    type: 'select', 
    icon: List, 
    label: 'Dropdown',
    description: 'Dropdown selection'
  },
  { 
    type: 'button', 
    icon: MousePointerClick, 
    label: 'Submit Button',
    description: 'Form submission button'
  },
];

function DraggableField({ fieldType }: { fieldType: FieldTypeInfo }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FIELD',
    item: { fieldType: fieldType.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  const Icon = fieldType.icon;
  
  return (
    <div
      ref={drag}
      className={`p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:bg-blue-50 transition-all ${
        isDragging ? 'opacity-50 scale-95 rotate-2' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{fieldType.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{fieldType.description}</p>
        </div>
      </div>
    </div>
  );
}

export function FieldPalette() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Form Fields</h3>
        <p className="text-xs text-gray-600">
          Drag fields to add them to your form. Reorder by dragging the grip icon.
        </p>
      </div>
      
      <div className="space-y-2">
        {fieldTypes.map(fieldType => (
          <DraggableField key={fieldType.type} fieldType={fieldType} />
        ))}
      </div>
    </div>
  );
}