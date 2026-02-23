import { X, Monitor, Tablet, Smartphone } from 'lucide-react';
import { FormVariant } from '../../types';
import { Button } from '../ui/button';
import { useState } from 'react';

interface FormPreviewProps {
  variant: FormVariant;
  campaignType: 'popup' | 'inline' | 'embedded';
  onClose: () => void;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function FormPreview({ variant, campaignType, onClose }: FormPreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');

  const renderField = (field: any) => {
    const baseInputClass = "w-full px-4 py-2 border rounded";
    
    if (field.type === 'button') {
      return (
        <button
          key={field.id}
          type="button"
          className="w-full py-3 px-6 rounded font-semibold"
          style={{
            backgroundColor: variant.styling.buttonColor,
            color: variant.styling.buttonTextColor,
            borderRadius: variant.styling.borderRadius
          }}
        >
          {field.buttonText || 'Submit'}
        </button>
      );
    }
    
    return (
      <div key={field.id} className="mb-4">
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
            {field.options?.map((opt: string, i: number) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <div className="space-y-2">
            {field.options?.map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        ) : field.type === 'radio' ? (
          <div className="space-y-2">
            {field.options?.map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" name={field.id} />
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
    );
  };
  
  // Device viewport dimensions
  const deviceDimensions = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  };
  
  const currentDimensions = deviceDimensions[device];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            <p className="text-sm text-gray-600">
              {campaignType === 'popup' ? 'Popup' : campaignType === 'embedded' ? 'Embedded Form' : 'Inline Form'} Preview
            </p>
          </div>
          
          {/* Device Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDevice('desktop')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  device === 'desktop' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">Desktop</span>
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  device === 'tablet' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span className="text-sm font-medium">Tablet</span>
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  device === 'mobile' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Mobile</span>
              </button>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Preview Container */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8 flex items-center justify-center">
          <div 
            className="bg-white rounded-lg shadow-lg transition-all duration-300 overflow-auto"
            style={{
              width: currentDimensions.width,
              maxWidth: '100%',
              height: device === 'desktop' ? 'auto' : currentDimensions.height,
              maxHeight: device === 'desktop' ? '100%' : currentDimensions.height,
            }}
          >
            <div className={`${device === 'desktop' ? 'p-8' : 'p-4 h-full overflow-y-auto'}`}>
              {campaignType === 'popup' ? (
                <div className={`${device === 'mobile' ? 'mx-auto' : 'max-w-md mx-auto'} flex items-center justify-center ${device !== 'desktop' ? 'min-h-full' : ''}`}>
                  <div
                    className="rounded-xl shadow-2xl overflow-hidden w-full"
                    style={{
                      backgroundColor: variant.styling.backgroundColor,
                      color: variant.styling.textColor
                    }}
                  >
                    <div className={device === 'mobile' ? 'p-6' : 'p-8'}>
                      <h2 className={`font-bold mb-2 ${device === 'mobile' ? 'text-xl' : 'text-2xl'}`}>
                        {variant.headline}
                      </h2>
                      <p className={`opacity-80 mb-6 ${device === 'mobile' ? 'text-sm' : ''}`}>
                        {variant.description}
                      </p>
                      
                      <form>
                        {variant.fields.map(renderField)}
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-xl shadow-lg overflow-hidden ${
                    device === 'mobile' ? 'w-full' : 'max-w-2xl mx-auto'
                  }`}
                  style={{
                    backgroundColor: variant.styling.backgroundColor,
                    color: variant.styling.textColor
                  }}
                >
                  <div className={device === 'mobile' ? 'p-6' : 'p-8'}>
                    <h2 className={`font-bold mb-2 ${device === 'mobile' ? 'text-xl' : 'text-2xl'}`}>
                      {variant.headline}
                    </h2>
                    <p className={`opacity-80 mb-6 ${device === 'mobile' ? 'text-sm' : ''}`}>
                      {variant.description}
                    </p>
                    
                    <form>
                      {variant.fields.map(renderField)}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer with device info */}
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>
              Viewport: {currentDimensions.width} × {device === 'desktop' ? 'auto' : currentDimensions.height}
            </span>
            {device !== 'desktop' && (
              <span className="text-gray-300">•</span>
            )}
            {device === 'tablet' && <span>iPad / Tablet View</span>}
            {device === 'mobile' && <span>iPhone / Mobile View</span>}
          </div>
        </div>
      </div>
    </div>
  );
}