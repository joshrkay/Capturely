/**
 * Campaign template library — 10 curated e-commerce templates.
 */

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "popup" | "inline";
  schema: {
    fields: Array<{
      fieldId: string;
      type: string;
      label: string;
      placeholder?: string;
      required?: boolean;
      options?: Array<{ value: string; label: string }>;
    }>;
    style: {
      backgroundColor: string;
      textColor: string;
      buttonColor: string;
      buttonTextColor: string;
      borderRadius: string;
      fontFamily: string;
    };
    submitLabel: string;
  };
}

export const TEMPLATES: CampaignTemplate[] = [
  {
    id: "email-capture",
    name: "Email Capture",
    description: "Simple email capture popup for building your mailing list",
    category: "Lead Generation",
    type: "popup",
    schema: {
      fields: [
        { fieldId: "field_email01", type: "email", label: "Email address", placeholder: "you@example.com", required: true },
        { fieldId: "field_submit01", type: "submit", label: "Subscribe" },
      ],
      style: { backgroundColor: "#ffffff", textColor: "#1a1a2e", buttonColor: "#6366f1", buttonTextColor: "#ffffff", borderRadius: "12px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Subscribe",
    },
  },
  {
    id: "welcome-discount",
    name: "Welcome Discount",
    description: "Offer a discount code in exchange for email signup",
    category: "E-commerce",
    type: "popup",
    schema: {
      fields: [
        { fieldId: "field_name01", type: "text", label: "First name", placeholder: "Jane", required: false },
        { fieldId: "field_email02", type: "email", label: "Email address", placeholder: "jane@example.com", required: true },
        { fieldId: "field_submit02", type: "submit", label: "Get 15% Off" },
      ],
      style: { backgroundColor: "#fef3c7", textColor: "#92400e", buttonColor: "#d97706", buttonTextColor: "#ffffff", borderRadius: "8px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Get 15% Off",
    },
  },
  {
    id: "exit-intent",
    name: "Exit Intent Offer",
    description: "Catch visitors before they leave with a special offer",
    category: "E-commerce",
    type: "popup",
    schema: {
      fields: [
        { fieldId: "field_email03", type: "email", label: "Your email", placeholder: "Enter your email", required: true },
        { fieldId: "field_submit03", type: "submit", label: "Claim Your Deal" },
      ],
      style: { backgroundColor: "#1e1b4b", textColor: "#e0e7ff", buttonColor: "#ef4444", buttonTextColor: "#ffffff", borderRadius: "16px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Claim Your Deal",
    },
  },
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Standard contact form with name, email, and message",
    category: "General",
    type: "inline",
    schema: {
      fields: [
        { fieldId: "field_name02", type: "text", label: "Full name", placeholder: "John Smith", required: true },
        { fieldId: "field_email04", type: "email", label: "Email", placeholder: "john@example.com", required: true },
        { fieldId: "field_phone01", type: "phone", label: "Phone (optional)", placeholder: "+1 (555) 000-0000", required: false },
        { fieldId: "field_msg01", type: "textarea", label: "Message", placeholder: "How can we help?", required: true },
        { fieldId: "field_submit04", type: "submit", label: "Send Message" },
      ],
      style: { backgroundColor: "#ffffff", textColor: "#374151", buttonColor: "#3b82f6", buttonTextColor: "#ffffff", borderRadius: "8px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Send Message",
    },
  },
  {
    id: "product-feedback",
    name: "Product Feedback",
    description: "Collect customer feedback on products they've purchased",
    category: "Feedback",
    type: "inline",
    schema: {
      fields: [
        { fieldId: "field_email05", type: "email", label: "Your email", placeholder: "you@example.com", required: true },
        { fieldId: "field_rating01", type: "radio", label: "How would you rate your experience?", required: true, options: [
          { value: "5", label: "Excellent" }, { value: "4", label: "Good" },
          { value: "3", label: "Average" }, { value: "2", label: "Poor" }, { value: "1", label: "Terrible" },
        ]},
        { fieldId: "field_feedback01", type: "textarea", label: "Tell us more", placeholder: "What did you love? What could be better?", required: false },
        { fieldId: "field_submit05", type: "submit", label: "Submit Feedback" },
      ],
      style: { backgroundColor: "#f9fafb", textColor: "#111827", buttonColor: "#10b981", buttonTextColor: "#ffffff", borderRadius: "8px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Submit Feedback",
    },
  },
  {
    id: "newsletter-signup",
    name: "Newsletter Signup",
    description: "Grow your newsletter with topic preferences",
    category: "Lead Generation",
    type: "inline",
    schema: {
      fields: [
        { fieldId: "field_name03", type: "text", label: "Name", placeholder: "Your name", required: false },
        { fieldId: "field_email06", type: "email", label: "Email", placeholder: "you@example.com", required: true },
        { fieldId: "field_topics01", type: "dropdown", label: "Interest", required: false, options: [
          { value: "deals", label: "Deals & Promotions" }, { value: "new-products", label: "New Products" },
          { value: "tips", label: "Tips & Guides" }, { value: "all", label: "Everything" },
        ]},
        { fieldId: "field_submit06", type: "submit", label: "Join Newsletter" },
      ],
      style: { backgroundColor: "#ffffff", textColor: "#1f2937", buttonColor: "#8b5cf6", buttonTextColor: "#ffffff", borderRadius: "10px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Join Newsletter",
    },
  },
  {
    id: "pre-launch-waitlist",
    name: "Pre-Launch Waitlist",
    description: "Build hype before a product launch",
    category: "E-commerce",
    type: "popup",
    schema: {
      fields: [
        { fieldId: "field_email07", type: "email", label: "Get early access", placeholder: "your@email.com", required: true },
        { fieldId: "field_submit07", type: "submit", label: "Join the Waitlist" },
      ],
      style: { backgroundColor: "#0f172a", textColor: "#f1f5f9", buttonColor: "#f59e0b", buttonTextColor: "#0f172a", borderRadius: "12px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Join the Waitlist",
    },
  },
  {
    id: "cart-abandonment",
    name: "Cart Abandonment",
    description: "Recover abandoned carts with a discount",
    category: "E-commerce",
    type: "popup",
    schema: {
      fields: [
        { fieldId: "field_email08", type: "email", label: "Email to save your cart", placeholder: "your@email.com", required: true },
        { fieldId: "field_submit08", type: "submit", label: "Save My Cart & Get 10% Off" },
      ],
      style: { backgroundColor: "#ffffff", textColor: "#1a1a2e", buttonColor: "#059669", buttonTextColor: "#ffffff", borderRadius: "8px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Save My Cart & Get 10% Off",
    },
  },
  {
    id: "survey-nps",
    name: "NPS Survey",
    description: "Net Promoter Score survey for customer satisfaction",
    category: "Feedback",
    type: "inline",
    schema: {
      fields: [
        { fieldId: "field_email09", type: "email", label: "Email", placeholder: "you@example.com", required: true },
        { fieldId: "field_nps01", type: "radio", label: "How likely are you to recommend us? (0-10)", required: true, options: [
          { value: "10", label: "10" }, { value: "9", label: "9" }, { value: "8", label: "8" },
          { value: "7", label: "7" }, { value: "6", label: "6" }, { value: "5", label: "5" },
          { value: "4", label: "4" }, { value: "3", label: "3" }, { value: "2", label: "2" },
          { value: "1", label: "1" }, { value: "0", label: "0" },
        ]},
        { fieldId: "field_reason01", type: "textarea", label: "What's the primary reason for your score?", placeholder: "Tell us why...", required: false },
        { fieldId: "field_submit09", type: "submit", label: "Submit" },
      ],
      style: { backgroundColor: "#ffffff", textColor: "#374151", buttonColor: "#6366f1", buttonTextColor: "#ffffff", borderRadius: "8px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Submit",
    },
  },
  {
    id: "lead-qualification",
    name: "Lead Qualification",
    description: "Qualify leads with company info and budget range",
    category: "Lead Generation",
    type: "inline",
    schema: {
      fields: [
        { fieldId: "field_name04", type: "text", label: "Full name", placeholder: "Jane Smith", required: true },
        { fieldId: "field_email10", type: "email", label: "Work email", placeholder: "jane@company.com", required: true },
        { fieldId: "field_company01", type: "text", label: "Company name", placeholder: "Acme Inc.", required: true },
        { fieldId: "field_size01", type: "dropdown", label: "Company size", required: true, options: [
          { value: "1-10", label: "1-10 employees" }, { value: "11-50", label: "11-50 employees" },
          { value: "51-200", label: "51-200 employees" }, { value: "201-1000", label: "201-1,000 employees" },
          { value: "1000+", label: "1,000+ employees" },
        ]},
        { fieldId: "field_budget01", type: "dropdown", label: "Monthly budget", required: false, options: [
          { value: "under-1k", label: "Under $1,000" }, { value: "1k-5k", label: "$1,000 - $5,000" },
          { value: "5k-25k", label: "$5,000 - $25,000" }, { value: "25k+", label: "$25,000+" },
        ]},
        { fieldId: "field_submit10", type: "submit", label: "Request Demo" },
      ],
      style: { backgroundColor: "#f8fafc", textColor: "#0f172a", buttonColor: "#2563eb", buttonTextColor: "#ffffff", borderRadius: "8px", fontFamily: "Inter, sans-serif" },
      submitLabel: "Request Demo",
    },
  },
];

export function getTemplate(id: string): CampaignTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): CampaignTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateCategories(): string[] {
  return [...new Set(TEMPLATES.map((t) => t.category))];
}
