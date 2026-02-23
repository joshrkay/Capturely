import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { FormVariant } from '../types';
import { generateId } from '../lib/utils';

interface AIFormGeneratorProps {
  onGenerate: (variant: FormVariant) => void;
  onCancel: () => void;
}

export function AIFormGenerator({ onGenerate, onCancel }: AIFormGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const examplePrompts = [
    'Newsletter signup with email and first name for 10% discount',
    'Contact form with name, email, phone, and message',
    'Waitlist signup for new product launch',
    'Lead generation form for B2B software demo',
    'Exit intent popup to capture abandoning visitors',
    'Event registration with name, email, and dietary preferences',
  ];

  const generateForm = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Smart pattern matching to generate appropriate form
    const lowerPrompt = prompt.toLowerCase();
    
    // Detect form type
    const isNewsletter = lowerPrompt.includes('newsletter') || lowerPrompt.includes('subscribe');
    const isContact = lowerPrompt.includes('contact') || lowerPrompt.includes('message');
    const isWaitlist = lowerPrompt.includes('waitlist') || lowerPrompt.includes('early access');
    const isDemo = lowerPrompt.includes('demo') || lowerPrompt.includes('b2b') || lowerPrompt.includes('enterprise');
    const isEvent = lowerPrompt.includes('event') || lowerPrompt.includes('registration');
    
    // Detect fields needed
    const needsEmail = true; // Always include email
    const needsName = lowerPrompt.includes('name') || isContact || isDemo || isEvent;
    const needsPhone = lowerPrompt.includes('phone') || isContact || isDemo;
    const needsCompany = lowerPrompt.includes('company') || lowerPrompt.includes('business') || isDemo;
    const needsMessage = lowerPrompt.includes('message') || isContact;
    
    // Extract discount percentage
    const discountMatch = lowerPrompt.match(/(\d+)%?\s*(off|discount)/);
    const discount = discountMatch ? `${discountMatch[1]}%` : '10%';
    
    // Build fields
    const fields: any[] = [];
    
    if (needsName) {
      fields.push({
        id: generateId(),
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your name',
        required: true
      });
    }
    
    fields.push({
      id: generateId(),
      type: 'email',
      label: 'Email Address',
      placeholder: 'you@example.com',
      required: true
    });
    
    if (needsPhone) {
      fields.push({
        id: generateId(),
        type: 'phone',
        label: 'Phone Number',
        placeholder: '(555) 123-4567',
        required: isDemo
      });
    }
    
    if (needsCompany) {
      fields.push({
        id: generateId(),
        type: 'text',
        label: 'Company Name',
        placeholder: 'Your company',
        required: true
      });
    }
    
    if (isDemo) {
      fields.push({
        id: generateId(),
        type: 'select',
        label: 'Company Size',
        placeholder: 'Select size',
        options: ['1-10', '11-50', '51-200', '201-500', '500+'],
        required: true
      });
    }
    
    if (needsMessage) {
      fields.push({
        id: generateId(),
        type: 'textarea',
        label: 'Message',
        placeholder: 'How can we help?',
        required: true
      });
    }
    
    if (isEvent) {
      fields.push({
        id: generateId(),
        type: 'select',
        label: 'Dietary Preferences',
        placeholder: 'Select preference',
        options: ['No restrictions', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'],
        required: false
      });
    }
    
    // Add submit button
    fields.push({
      id: generateId(),
      type: 'button',
      label: 'Submit',
      buttonText: isNewsletter ? 'Subscribe Now' : 
                  isWaitlist ? 'Join Waitlist' :
                  isDemo ? 'Request Demo' :
                  isEvent ? 'Register Now' :
                  'Submit'
    });
    
    // Generate headline and description
    let headline = '';
    let description = '';
    let bgColor = '#ffffff';
    let buttonColor = '#3b82f6';
    
    if (isNewsletter) {
      headline = 'Stay in the Loop';
      description = `Subscribe to our newsletter and get ${discount} off your first order!`;
      bgColor = '#ffffff';
      buttonColor = '#3b82f6';
    } else if (isWaitlist) {
      headline = 'Join the Waitlist';
      description = 'Be the first to know when we launch. Get exclusive early access!';
      bgColor = '#ede9fe';
      buttonColor = '#8b5cf6';
    } else if (isDemo) {
      headline = 'Request a Demo';
      description = 'See how our platform can transform your business in just 30 minutes.';
      bgColor = '#f0f9ff';
      buttonColor = '#0284c7';
    } else if (isEvent) {
      headline = 'Register for Event';
      description = 'Save your spot and join us for an amazing experience.';
      bgColor = '#fef3c7';
      buttonColor = '#f59e0b';
    } else if (isContact) {
      headline = 'Get in Touch';
      description = 'We\'d love to hear from you. Send us a message!';
      bgColor = '#f9fafb';
      buttonColor = '#6366f1';
    } else {
      headline = 'Let\'s Connect';
      description = 'Fill out the form below and we\'ll get back to you soon.';
      bgColor = '#ffffff';
      buttonColor = '#3b82f6';
    }
    
    const variant: FormVariant = {
      id: generateId(),
      name: 'AI Generated',
      isControl: true,
      headline,
      description,
      fields,
      styling: {
        backgroundColor: bgColor,
        textColor: '#000000',
        buttonColor,
        buttonTextColor: '#ffffff',
        borderRadius: '8px',
        fontFamily: 'system-ui'
      }
    };
    
    setIsGenerating(false);
    onGenerate(variant);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Form Generator</h2>
            <p className="text-sm text-gray-600">Describe your form and let AI build it for you</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What kind of form do you need?
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Newsletter signup with email and first name for 10% discount"
              className="min-h-[120px]"
              disabled={isGenerating}
            />
          </div>

          {/* Example Prompts */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-700 transition-colors"
                  disabled={isGenerating}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={generateForm}
              disabled={!prompt.trim() || isGenerating}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Form
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
