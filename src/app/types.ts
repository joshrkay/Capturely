// Core data types for the form builder

export type FieldType = 'text' | 'email' | 'phone' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'button';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For radio, checkbox, select
  buttonText?: string; // For button type
  validation?: {
    pattern?: string;
    message?: string;
  };
  stepNumber?: number; // For multi-step forms
  conditionalLogic?: {
    showIf?: {
      fieldId: string;
      condition: 'equals' | 'contains' | 'not_equals';
      value: string;
    };
  };
}

export interface FormStyling {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: string;
  fontFamily: string;
}

export interface DisplayRules {
  trigger: 'immediate' | 'delay' | 'scroll' | 'exit' | 'exit_intent' | 'page_load';
  delaySeconds?: number;
  scrollPercent?: number;
  pages?: string[]; // URL patterns
  frequency?: {
    enabled: boolean;
    maxDisplays?: number;
    timeWindow?: 'session' | 'day' | 'week';
  };
  deviceTargeting?: {
    enabled: boolean;
    devices?: ('desktop' | 'tablet' | 'mobile')[];
  };
}

export interface SpamProtection {
  enabled: boolean;
  honeypot: boolean;
  reCaptcha?: {
    enabled: boolean;
    siteKey?: string;
  };
  emailVerification?: boolean;
  rateLimit?: {
    enabled: boolean;
    maxSubmissions: number;
    timeWindow: number; // minutes
  };
}

export interface Integration {
  id: string;
  type: 'mailchimp' | 'hubspot' | 'salesforce' | 'google_sheets' | 'slack' | 'zapier' | 'webhook';
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: string;
}

export interface FormVariant {
  id: string;
  name: string;
  fields: FormField[];
  styling: FormStyling;
  isControl: boolean;
  headline?: string;
  description?: string;
  multiStep?: {
    enabled: boolean;
    steps: {
      id: string;
      name: string;
      fieldIds: string[];
    }[];
  };
}

export interface Campaign {
  id: string;
  name: string;
  type: 'popup' | 'inline' | 'embedded';
  status: 'draft' | 'active' | 'paused' | 'archived';
  variants: FormVariant[];
  displayRules: DisplayRules;
  zapierWebhook?: string;
  integrations?: string[]; // Integration IDs
  spamProtection?: SpamProtection;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  campaignId: string;
  variantId: string;
  data: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  status?: 'new' | 'read' | 'archived';
  isSpam?: boolean;
  source?: string; // Attribution tracking
}

export interface VariantMetrics {
  variantId: string;
  variantName: string;
  views: number;
  submissions: number;
  conversionRate: number;
  confidence?: number; // Statistical confidence level
  isWinner?: boolean;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalViews: number;
  totalSubmissions: number;
  overallConversionRate: number;
  variants: VariantMetrics[];
  statisticalSignificance?: {
    hasEnoughData: boolean;
    confidenceLevel: number;
    recommendedAction?: string;
    samplesNeeded?: number;
  };
}

export type Analytics = CampaignAnalytics;

export interface Template {
  id: string;
  name: string;
  category: 'newsletter' | 'discount' | 'contact' | 'quote' | 'appointment' | 'support' | 'waitlist' | 'wholesale';
  description: string;
  type: 'popup' | 'inline';
  thumbnail?: string;
  variant: Omit<FormVariant, 'id' | 'isControl'>;
}