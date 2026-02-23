import { useState } from 'react';
import { Save, Zap, Code, Globe, CreditCard, Check, AlertCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Link } from 'react-router';

type Plan = 'free' | 'starter' | 'pro' | 'enterprise';

export function Settings() {
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [wordpressSite, setWordpressSite] = useState('');
  const [currentPlan, setCurrentPlan] = useState<Plan>('starter');
  
  const handleSave = () => {
    toast.success('Settings saved successfully');
  };
  
  const handleUpgrade = (plan: Plan) => {
    setCurrentPlan(plan);
    toast.success(`Upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`);
  };
  
  const handleDowngrade = (plan: Plan) => {
    setCurrentPlan(plan);
    toast.success(`Downgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`);
  };
  
  const handleCancel = () => {
    setCurrentPlan('free');
    toast.success('Subscription cancelled. You\'ll retain access until the end of your billing period.');
  };
  
  const plans = [
    {
      id: 'free' as Plan,
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '1 active campaign',
        '100 submissions/month',
        'Basic templates',
        'Email support',
      ],
    },
    {
      id: 'starter' as Plan,
      name: 'Starter',
      price: '$29',
      period: 'per month',
      features: [
        '5 active campaigns',
        '1,000 submissions/month',
        'All templates',
        'A/B testing (2 variants)',
        'Priority support',
        'Zapier integration',
      ],
    },
    {
      id: 'pro' as Plan,
      name: 'Pro',
      price: '$99',
      period: 'per month',
      features: [
        'Unlimited campaigns',
        '10,000 submissions/month',
        'All templates',
        'Advanced A/B testing',
        'Custom branding',
        'All integrations',
        '24/7 support',
        'Custom CSS',
      ],
      popular: true,
    },
    {
      id: 'enterprise' as Plan,
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact sales',
      features: [
        'Everything in Pro',
        'Unlimited submissions',
        'Dedicated account manager',
        'Custom development',
        'SLA guarantee',
        'Advanced analytics',
      ],
    },
  ];
  
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and integrations</p>
      </div>
      
      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Zapier */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Zapier Integration
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Send form submissions to 5,000+ apps via Zapier webhooks
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="zapierWebhook">Default Webhook URL</Label>
                      <Textarea
                        id="zapierWebhook"
                        value={zapierWebhook}
                        onChange={(e) => setZapierWebhook(e.target.value)}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This webhook will be used as the default for new campaigns
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        How to connect Zapier
                      </h4>
                      <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Create a new Zap in Zapier</li>
                        <li>Choose "Webhooks by Zapier" as the trigger</li>
                        <li>Select "Catch Hook" and copy the webhook URL</li>
                        <li>Paste the URL here or in your campaign settings</li>
                        <li>Test the connection by submitting a form</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Future Integrations */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Coming Soon
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Klaviyo', icon: '💌' },
                  { name: 'Mailchimp', icon: '🐵' },
                  { name: 'HubSpot', icon: '🟠' },
                  { name: 'Salesforce', icon: '☁️' },
                ].map(integration => (
                  <div
                    key={integration.name}
                    className="p-4 border border-gray-200 rounded-lg opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{integration.name}</p>
                        <p className="text-xs text-gray-500">Coming soon</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="platforms">
          <div className="space-y-6">
            {/* Shopify */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Shopify App
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Install Capturely directly in your Shopify store
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="shopifyDomain">Shopify Store Domain</Label>
                      <Input
                        id="shopifyDomain"
                        value={shopifyDomain}
                        onChange={(e) => setShopifyDomain(e.target.value)}
                        placeholder="yourstore.myshopify.com"
                      />
                    </div>
                    
                    <Button variant="outline">
                      Install Shopify App
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* WordPress */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    WordPress Plugin
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add forms to your WordPress site with our plugin
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="wordpressSite">WordPress Site URL</Label>
                      <Input
                        id="wordpressSite"
                        value={wordpressSite}
                        onChange={(e) => setWordpressSite(e.target.value)}
                        placeholder="https://yoursite.com"
                      />
                    </div>
                    
                    <Button variant="outline">
                      Download Plugin
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Universal Embed */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Universal Embed Code
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Works on any website - just paste this code before the closing &lt;/body&gt; tag
                  </p>
                  
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-green-400 font-mono">
{`<script src="https://cdn.capturely.app/widget.js"></script>
<script>
  Capturely.init({
    accountId: "your_account_id"
  });
</script>`}
                    </code>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <div className="space-y-6">
            {/* Account Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="user@example.com"
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Your Company"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                  </select>
                </div>
              </div>
            </Card>
            
            {/* Current Plan */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Current Plan
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage your subscription and billing
                  </p>
                </div>
                <Badge className="bg-purple-100 text-purple-700 px-3 py-1">
                  {plans.find(p => p.id === currentPlan)?.name}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Monthly Price</p>
                    <p className="text-xs text-gray-500">Billed monthly</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {plans.find(p => p.id === currentPlan)?.price}
                    {currentPlan !== 'free' && currentPlan !== 'enterprise' && (
                      <span className="text-sm font-normal text-gray-600">/mo</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Next Billing Date</p>
                    <p className="text-xs text-gray-500">Auto-renews on this date</p>
                  </div>
                  <p className="text-sm text-gray-900">
                    {currentPlan === 'free' ? 'N/A' : 'March 23, 2026'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Method</p>
                    <p className="text-xs text-gray-500">Default payment method</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {currentPlan === 'free' ? 'None' : '•••• 4242'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Billing Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Billing Information
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="•••• •••• •••• 4242"
                      disabled={currentPlan === 'free'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM / YY"
                      disabled={currentPlan === 'free'}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Input
                    id="billingAddress"
                    placeholder="123 Main St, San Francisco, CA 94105"
                    disabled={currentPlan === 'free'}
                  />
                </div>
                
                {currentPlan !== 'free' && (
                  <Button variant="outline" size="sm">
                    Update Payment Method
                  </Button>
                )}
              </div>
            </Card>
            
            {/* Available Plans */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Plans
              </h3>
              
              <div className="grid gap-4">
                {plans.map(plan => {
                  const isCurrent = plan.id === currentPlan;
                  const planIndex = plans.findIndex(p => p.id === plan.id);
                  const currentIndex = plans.findIndex(p => p.id === currentPlan);
                  const isUpgrade = planIndex > currentIndex;
                  const isDowngrade = planIndex < currentIndex;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrent
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${plan.popular ? 'ring-2 ring-purple-200' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                            {plan.popular && (
                              <Badge className="bg-purple-600 text-white text-xs">
                                Popular
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge className="bg-green-600 text-white text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-2xl font-bold text-gray-900 mb-2">
                            {plan.price}
                            {plan.price !== 'Custom' && plan.id !== 'free' && (
                              <span className="text-sm font-normal text-gray-600">
                                /{plan.period.replace('per ', '')}
                              </span>
                            )}
                          </p>
                          
                          <ul className="space-y-1 mb-4">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="ml-4">
                          {!isCurrent && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant={isUpgrade ? 'default' : 'outline'}
                                  size="sm"
                                >
                                  {plan.id === 'enterprise'
                                    ? 'Contact Sales'
                                    : isUpgrade
                                    ? 'Upgrade'
                                    : 'Downgrade'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {isUpgrade ? 'Upgrade Plan' : 'Downgrade Plan'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {isUpgrade ? (
                                      <>
                                        You're about to upgrade to the <strong>{plan.name}</strong> plan.
                                        You'll be charged a prorated amount for the remainder of your billing period.
                                      </>
                                    ) : (
                                      <>
                                        You're about to downgrade to the <strong>{plan.name}</strong> plan.
                                        Your new plan will take effect at the end of your current billing period.
                                      </>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      isUpgrade ? handleUpgrade(plan.id) : handleDowngrade(plan.id)
                                    }
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            
            {/* Cancel Subscription */}
            {currentPlan !== 'free' && (
              <Card className="p-6 border-red-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Cancel Subscription
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      You'll retain access to your current plan until the end of your billing period.
                      After that, you'll be downgraded to the Free plan.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel your subscription to the {plans.find(p => p.id === currentPlan)?.name} plan.
                            You'll continue to have access until <strong>March 23, 2026</strong>, after which
                            you'll be moved to the Free plan with limited features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancel}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, Cancel Subscription
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}