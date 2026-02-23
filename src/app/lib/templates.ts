import { Template } from '../types';

export const templates: Template[] = [
  {
    id: 'newsletter-1',
    name: 'Newsletter Signup',
    category: 'newsletter',
    description: 'Simple email capture for newsletter signups',
    type: 'popup',
    variant: {
      name: 'Newsletter Signup',
      headline: 'Join our newsletter',
      description: 'Get the latest updates and exclusive offers',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'you@example.com',
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Subscribe',
          buttonText: 'Subscribe'
        }
      ],
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        borderRadius: '12px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'discount-1',
    name: 'Discount Code Popup',
    category: 'discount',
    description: 'Offer a discount code in exchange for email',
    type: 'popup',
    variant: {
      name: 'Discount Popup',
      headline: 'Get 15% Off!',
      description: 'Enter your email to receive your discount code',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'you@example.com',
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Get My Code',
          buttonText: 'Get My Code'
        }
      ],
      styling: {
        backgroundColor: '#fef3c7',
        textColor: '#78350f',
        buttonColor: '#f59e0b',
        buttonTextColor: '#ffffff',
        borderRadius: '8px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'contact-1',
    name: 'Contact Form',
    category: 'contact',
    description: 'Standard contact form with name, email, and message',
    type: 'inline',
    variant: {
      name: 'Contact Form',
      headline: 'Get in touch',
      description: 'We\'d love to hear from you',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Your name',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'you@example.com',
          required: true
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          placeholder: 'Tell us what you\'re thinking...',
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Send Message',
          buttonText: 'Send Message'
        }
      ],
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#111827',
        buttonColor: '#10b981',
        buttonTextColor: '#ffffff',
        borderRadius: '8px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'quote-1',
    name: 'Request a Quote',
    category: 'quote',
    description: 'Collect quote requests with project details',
    type: 'inline',
    variant: {
      name: 'Quote Request',
      headline: 'Request a Quote',
      description: 'Tell us about your project',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'John Smith',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'john@company.com',
          required: true
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone Number',
          placeholder: '(555) 123-4567',
          required: false
        },
        {
          id: 'project',
          type: 'textarea',
          label: 'Project Details',
          placeholder: 'Describe your project...',
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Submit',
          buttonText: 'Get Quote'
        }
      ],
      styling: {
        backgroundColor: '#f3f4f6',
        textColor: '#111827',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        borderRadius: '10px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'appointment-1',
    name: 'Book Appointment',
    category: 'appointment',
    description: 'Appointment booking form',
    type: 'inline',
    variant: {
      name: 'Book Appointment',
      headline: 'Schedule Your Appointment',
      description: 'Choose a time that works for you',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Your name',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'you@example.com',
          required: true
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone',
          placeholder: '(555) 123-4567',
          required: true
        },
        {
          id: 'service',
          type: 'select',
          label: 'Service',
          placeholder: 'Select a service',
          required: true,
          options: ['Consultation', 'Follow-up', 'New Patient']
        },
        {
          id: 'notes',
          type: 'textarea',
          label: 'Additional Notes',
          placeholder: 'Any special requests?',
          required: false
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Book',
          buttonText: 'Book Appointment'
        }
      ],
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        buttonColor: '#8b5cf6',
        buttonTextColor: '#ffffff',
        borderRadius: '12px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'support-1',
    name: 'Support Request',
    category: 'support',
    description: 'Customer support ticket form',
    type: 'inline',
    variant: {
      name: 'Support Request',
      headline: 'Need Help?',
      description: 'Submit a support request and we\'ll get back to you soon',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Your name',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'you@example.com',
          required: true
        },
        {
          id: 'priority',
          type: 'radio',
          label: 'Priority',
          required: true,
          options: ['Low', 'Medium', 'High', 'Urgent']
        },
        {
          id: 'issue',
          type: 'textarea',
          label: 'Describe the Issue',
          placeholder: 'What seems to be the problem?',
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Submit',
          buttonText: 'Submit Ticket'
        }
      ],
      styling: {
        backgroundColor: '#ffffff',
        textColor: '#111827',
        buttonColor: '#ef4444',
        buttonTextColor: '#ffffff',
        borderRadius: '8px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'waitlist-1',
    name: 'Join Waitlist',
    category: 'waitlist',
    description: 'Product waitlist signup',
    type: 'popup',
    variant: {
      name: 'Waitlist',
      headline: 'Join the Waitlist',
      description: 'Be the first to know when this product is back in stock',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'you@example.com',
          required: true
        },
        {
          id: 'notify',
          type: 'checkbox',
          label: 'Preferences',
          options: ['Email me about similar products', 'Send me promotional offers'],
          required: false
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Join',
          buttonText: 'Join Waitlist'
        }
      ],
      styling: {
        backgroundColor: '#fef2f2',
        textColor: '#991b1b',
        buttonColor: '#dc2626',
        buttonTextColor: '#ffffff',
        borderRadius: '8px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'wholesale-1',
    name: 'Wholesale Inquiry',
    category: 'wholesale',
    description: 'Wholesale application form',
    type: 'inline',
    variant: {
      name: 'Wholesale Application',
      headline: 'Wholesale Application',
      description: 'Apply for a wholesale account',
      fields: [
        {
          id: 'business',
          type: 'text',
          label: 'Business Name',
          placeholder: 'Your Company LLC',
          required: true
        },
        {
          id: 'name',
          type: 'text',
          label: 'Contact Name',
          placeholder: 'John Smith',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Business Email',
          placeholder: 'contact@company.com',
          required: true
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone',
          placeholder: '(555) 123-4567',
          required: true
        },
        {
          id: 'website',
          type: 'text',
          label: 'Website',
          placeholder: 'www.yourcompany.com',
          required: false
        },
        {
          id: 'details',
          type: 'textarea',
          label: 'Tell us about your business',
          placeholder: 'What products are you interested in?',
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Submit',
          buttonText: 'Submit Application'
        }
      ],
      styling: {
        backgroundColor: '#f0fdf4',
        textColor: '#14532d',
        buttonColor: '#16a34a',
        buttonTextColor: '#ffffff',
        borderRadius: '10px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'newsletter-2',
    name: 'Minimalist Newsletter',
    category: 'newsletter',
    description: 'Clean, minimal newsletter signup',
    type: 'popup',
    variant: {
      name: 'Minimalist Newsletter',
      headline: 'Stay Updated',
      description: 'Subscribe to our newsletter',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Subscribe',
          buttonText: 'Subscribe'
        }
      ],
      styling: {
        backgroundColor: '#000000',
        textColor: '#ffffff',
        buttonColor: '#ffffff',
        buttonTextColor: '#000000',
        borderRadius: '4px',
        fontFamily: 'system-ui'
      }
    }
  },
  {
    id: 'discount-2',
    name: 'First Purchase Discount',
    category: 'discount',
    description: 'First-time buyer discount popup',
    type: 'popup',
    variant: {
      name: 'First Purchase',
      headline: 'Welcome! 🎉',
      description: 'Get 20% off your first purchase',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          required: true
        },
        {
          id: 'agree',
          type: 'checkbox',
          label: '',
          options: ['I agree to receive marketing emails'],
          required: true
        },
        {
          id: 'submit',
          type: 'button',
          label: 'Claim',
          buttonText: 'Claim Discount'
        }
      ],
      styling: {
        backgroundColor: '#dbeafe',
        textColor: '#1e3a8a',
        buttonColor: '#2563eb',
        buttonTextColor: '#ffffff',
        borderRadius: '16px',
        fontFamily: 'system-ui'
      }
    }
  }
];

export const getTemplatesByCategory = (category: Template['category']): Template[] => {
  return templates.filter(t => t.category === category);
};

export const getTemplate = (id: string): Template | undefined => {
  return templates.find(t => t.id === id);
};
