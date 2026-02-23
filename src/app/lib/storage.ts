// Local storage utilities for persistence
import { Campaign, Submission, CampaignAnalytics } from '../types';

const CAMPAIGNS_KEY = 'capturely_campaigns';
const SUBMISSIONS_KEY = 'capturely_submissions';
const ANALYTICS_KEY = 'capturely_analytics';

// Campaigns
export const getCampaigns = (): Campaign[] => {
  const data = localStorage.getItem(CAMPAIGNS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getCampaign = (id: string): Campaign | undefined => {
  const campaigns = getCampaigns();
  return campaigns.find(c => c.id === id);
};

export const saveCampaign = (campaign: Campaign): void => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  
  if (index >= 0) {
    campaigns[index] = campaign;
  } else {
    campaigns.push(campaign);
  }
  
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
};

export const deleteCampaign = (id: string): void => {
  const campaigns = getCampaigns().filter(c => c.id !== id);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  
  // Also delete related submissions and analytics
  const submissions = getSubmissions().filter(s => s.campaignId !== id);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  
  const analytics = getAllAnalytics();
  const index = analytics.findIndex(a => a.campaignId === id);
  if (index >= 0) {
    analytics.splice(index, 1);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
  }
};

// Submissions
export const getSubmissions = (): Submission[] => {
  const data = localStorage.getItem(SUBMISSIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getCampaignSubmissions = (campaignId: string): Submission[] => {
  return getSubmissions().filter(s => s.campaignId === campaignId);
};

export const saveSubmission = (submission: Submission): void => {
  const submissions = getSubmissions();
  submissions.push(submission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
};

export const updateSubmission = (id: string, updates: Partial<Submission>): void => {
  const submissions = getSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index >= 0) {
    submissions[index] = { ...submissions[index], ...updates };
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  }
};

export const deleteSubmission = (id: string): void => {
  const submissions = getSubmissions().filter(s => s.id !== id);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
};

export const bulkUpdateSubmissions = (ids: string[], updates: Partial<Submission>): void => {
  const submissions = getSubmissions();
  ids.forEach(id => {
    const index = submissions.findIndex(s => s.id === id);
    if (index >= 0) {
      submissions[index] = { ...submissions[index], ...updates };
    }
  });
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
};

export const bulkDeleteSubmissions = (ids: string[]): void => {
  const submissions = getSubmissions().filter(s => !ids.includes(s.id));
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
};

// Helper function to get analytics from local storage
const getAnalytics = (): CampaignAnalytics[] => {
  try {
    const data = localStorage.getItem(ANALYTICS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading analytics from localStorage:', error);
    return [];
  }
};

// Analytics
export const getCampaignAnalytics = (campaignId: string): CampaignAnalytics | null => {
  const analytics = getAnalytics();
  return analytics.find(a => a.campaignId === campaignId) || null;
};

export const getAllAnalytics = (): CampaignAnalytics[] => {
  return getAnalytics();
};

export const updateAnalytics = (analytics: CampaignAnalytics): void => {
  const allAnalytics = getAllAnalytics();
  const index = allAnalytics.findIndex(a => a.campaignId === analytics.campaignId);
  
  if (index >= 0) {
    allAnalytics[index] = analytics;
  } else {
    allAnalytics.push(analytics);
  }
  
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(allAnalytics));
};

export const incrementView = (campaignId: string, variantId: string): void => {
  const analytics = getCampaignAnalytics(campaignId) || {
    campaignId,
    totalViews: 0,
    totalSubmissions: 0,
    overallConversionRate: 0,
    variants: []
  };
  
  analytics.totalViews++;
  
  const variantIndex = analytics.variants.findIndex(v => v.variantId === variantId);
  if (variantIndex >= 0) {
    analytics.variants[variantIndex].views++;
  } else {
    const campaign = getCampaign(campaignId);
    const variant = campaign?.variants.find(v => v.id === variantId);
    analytics.variants.push({
      variantId,
      variantName: variant?.name || 'Unknown',
      views: 1,
      submissions: 0,
      conversionRate: 0
    });
  }
  
  // Recalculate conversion rates
  analytics.variants.forEach(v => {
    v.conversionRate = v.views > 0 ? (v.submissions / v.views) * 100 : 0;
  });
  analytics.overallConversionRate = analytics.totalViews > 0 
    ? (analytics.totalSubmissions / analytics.totalViews) * 100 
    : 0;
  
  updateAnalytics(analytics);
};

export const incrementSubmission = (campaignId: string, variantId: string): void => {
  const analytics = getCampaignAnalytics(campaignId) || {
    campaignId,
    totalViews: 0,
    totalSubmissions: 0,
    overallConversionRate: 0,
    variants: []
  };
  
  analytics.totalSubmissions++;
  
  const variantIndex = analytics.variants.findIndex(v => v.variantId === variantId);
  if (variantIndex >= 0) {
    analytics.variants[variantIndex].submissions++;
  }
  
  // Recalculate conversion rates
  analytics.variants.forEach(v => {
    v.conversionRate = v.views > 0 ? (v.submissions / v.views) * 100 : 0;
  });
  analytics.overallConversionRate = analytics.totalViews > 0 
    ? (analytics.totalSubmissions / analytics.totalViews) * 100 
    : 0;
  
  updateAnalytics(analytics);
};

// Initialize with sample data if empty
export const initializeSampleData = (): void => {
  const campaigns = getCampaigns();
  if (campaigns.length === 0) {
    // Add multiple sample campaigns
    const sampleCampaigns = [
      {
        id: 'sample-1',
        name: 'Newsletter Signup',
        type: 'popup',
        status: 'active',
        displayRules: { trigger: 'delay', delaySeconds: 3 },
        variants: [
          {
            id: 'variant-1',
            name: 'Control',
            isControl: true,
            headline: 'Join our newsletter',
            description: 'Get 10% off your first order',
            fields: [
              { id: 'field-1', type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
              { id: 'field-2', type: 'button', label: 'Subscribe', buttonText: 'Subscribe Now' }
            ],
            styling: {
              backgroundColor: '#ffffff',
              textColor: '#000000',
              buttonColor: '#3b82f6',
              buttonTextColor: '#ffffff',
              borderRadius: '8px',
              fontFamily: 'system-ui'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-2',
        name: 'Exit Intent Offer',
        type: 'popup',
        status: 'active',
        displayRules: { trigger: 'exit_intent' },
        variants: [
          {
            id: 'variant-2a',
            name: 'Variant A',
            isControl: true,
            headline: 'Wait! Don\'t leave empty-handed',
            description: 'Get 15% off your first purchase',
            fields: [
              { id: 'field-1', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
              { id: 'field-2', type: 'button', label: 'Claim', buttonText: 'Claim Discount' }
            ],
            styling: {
              backgroundColor: '#fef3c7',
              textColor: '#78350f',
              buttonColor: '#f59e0b',
              buttonTextColor: '#ffffff',
              borderRadius: '12px',
              fontFamily: 'system-ui'
            }
          },
          {
            id: 'variant-2b',
            name: 'Variant B',
            isControl: false,
            headline: 'Special Offer Just For You!',
            description: 'Save 20% on your order today',
            fields: [
              { id: 'field-1', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
              { id: 'field-2', type: 'button', label: 'Claim', buttonText: 'Get My Discount' }
            ],
            styling: {
              backgroundColor: '#ffffff',
              textColor: '#000000',
              buttonColor: '#10b981',
              buttonTextColor: '#ffffff',
              borderRadius: '12px',
              fontFamily: 'system-ui'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-3',
        name: 'Contact Form',
        type: 'embedded',
        status: 'active',
        displayRules: { trigger: 'page_load' },
        variants: [
          {
            id: 'variant-3',
            name: 'Default',
            isControl: true,
            headline: 'Get in Touch',
            description: 'We\'d love to hear from you',
            fields: [
              { id: 'field-1', type: 'text', label: 'Name', placeholder: 'Your name', required: true },
              { id: 'field-2', type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
              { id: 'field-3', type: 'textarea', label: 'Message', placeholder: 'Your message', required: true },
              { id: 'field-4', type: 'button', label: 'Send', buttonText: 'Send Message' }
            ],
            styling: {
              backgroundColor: '#f9fafb',
              textColor: '#111827',
              buttonColor: '#6366f1',
              buttonTextColor: '#ffffff',
              borderRadius: '8px',
              fontFamily: 'system-ui'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-4',
        name: 'Early Access Signup',
        type: 'popup',
        status: 'paused',
        displayRules: { trigger: 'scroll', scrollPercent: 50 },
        variants: [
          {
            id: 'variant-4',
            name: 'Main',
            isControl: true,
            headline: 'Join Our Beta Program',
            description: 'Be the first to try our new features',
            fields: [
              { id: 'field-1', type: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
              { id: 'field-2', type: 'button', label: 'Join', buttonText: 'Join Waitlist' }
            ],
            styling: {
              backgroundColor: '#ede9fe',
              textColor: '#5b21b6',
              buttonColor: '#8b5cf6',
              buttonTextColor: '#ffffff',
              borderRadius: '16px',
              fontFamily: 'system-ui'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-5',
        name: 'Product Survey',
        type: 'embedded',
        status: 'draft',
        displayRules: { trigger: 'page_load' },
        variants: [
          {
            id: 'variant-5',
            name: 'v1',
            isControl: true,
            headline: 'Help Us Improve',
            description: 'Share your feedback',
            fields: [
              { id: 'field-1', type: 'text', label: 'What feature would you like?', placeholder: 'Type here...', required: true },
              { id: 'field-2', type: 'button', label: 'Submit', buttonText: 'Submit Feedback' }
            ],
            styling: {
              backgroundColor: '#ffffff',
              textColor: '#000000',
              buttonColor: '#ec4899',
              buttonTextColor: '#ffffff',
              borderRadius: '8px',
              fontFamily: 'system-ui'
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    sampleCampaigns.forEach(campaign => saveCampaign(campaign as Campaign));
    
    // Add sample analytics for each campaign
    const analyticsData = [
      {
        campaignId: 'sample-1',
        totalViews: 1250,
        totalSubmissions: 187,
        overallConversionRate: 14.96,
        variants: [
          { variantId: 'variant-1', variantName: 'Control', views: 1250, submissions: 187, conversionRate: 14.96 }
        ]
      },
      {
        campaignId: 'sample-2',
        totalViews: 2840,
        totalSubmissions: 468,
        overallConversionRate: 16.48,
        variants: [
          { variantId: 'variant-2a', variantName: 'Variant A', views: 1420, submissions: 198, conversionRate: 13.94 },
          { variantId: 'variant-2b', variantName: 'Variant B', views: 1420, submissions: 270, conversionRate: 19.01 }
        ]
      },
      {
        campaignId: 'sample-3',
        totalViews: 892,
        totalSubmissions: 134,
        overallConversionRate: 15.02,
        variants: [
          { variantId: 'variant-3', variantName: 'Default', views: 892, submissions: 134, conversionRate: 15.02 }
        ]
      },
      {
        campaignId: 'sample-4',
        totalViews: 456,
        totalSubmissions: 52,
        overallConversionRate: 11.40,
        variants: [
          { variantId: 'variant-4', variantName: 'Main', views: 456, submissions: 52, conversionRate: 11.40 }
        ]
      },
      {
        campaignId: 'sample-5',
        totalViews: 0,
        totalSubmissions: 0,
        overallConversionRate: 0,
        variants: [
          { variantId: 'variant-5', variantName: 'v1', views: 0, submissions: 0, conversionRate: 0 }
        ]
      }
    ];
    
    analyticsData.forEach(analytics => updateAnalytics(analytics as CampaignAnalytics));
    
    // Add sample submissions for Newsletter Signup
    const sampleEmails = [
      'john.doe@example.com',
      'sarah.johnson@gmail.com',
      'mike.smith@outlook.com',
      'emily.brown@yahoo.com',
      'david.wilson@company.com',
      'lisa.anderson@email.com',
      'james.taylor@business.com',
      'mary.white@mail.com',
      'robert.jones@work.com',
      'jennifer.davis@website.com',
      'william.miller@test.com',
      'patricia.garcia@demo.com',
      'richard.martinez@sample.com',
      'barbara.rodriguez@example.org',
      'thomas.lee@mymail.com'
    ];
    
    const now = new Date();
    sampleEmails.forEach((email, index) => {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));
      
      const submission: Submission = {
        id: `submission-${index + 1}`,
        campaignId: 'sample-1',
        variantId: 'variant-1',
        data: {
          'Email Address': email
        },
        timestamp: timestamp.toISOString(),
        status: index < 3 ? 'new' : 'read'
      };
      
      saveSubmission(submission);
    });
  }
};