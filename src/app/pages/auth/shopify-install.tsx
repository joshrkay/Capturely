import { useState } from 'react';
import { Sparkles, ShoppingBag, Check, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { toast } from 'sonner';
import { Logo } from '../../components/logo';

export function ShopifyInstall() {
  const [shopDomain, setShopDomain] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain.trim()) {
      toast.error('Please enter your shop domain');
      return;
    }

    // Validate shop domain format
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\.myshopify\.com.*$/, '');
    
    if (!cleanDomain) {
      toast.error('Invalid shop domain');
      return;
    }

    setIsInstalling(true);

    // In production, this would redirect to Shopify OAuth
    // For now, simulate the OAuth flow
    setTimeout(() => {
      const authUrl = `/auth/shopify/callback?shop=${cleanDomain}.myshopify.com&code=mock_auth_code`;
      window.location.href = authUrl;
    }, 1500);
  };

  const features = [
    'Popup & inline forms on your storefront',
    'Cart abandonment recovery',
    'Email & SMS capture',
    'A/B testing built-in',
    'Real-time analytics',
    'Zapier integration',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Logo size="xl" showText={false} />
            <span className="text-4xl font-bold text-gray-400">×</span>
            <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Capturely for Shopify
          </h1>
          <p className="text-xl text-gray-600">
            Install in 2 minutes. Start capturing leads in 15 minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Install Form */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Install on Your Store
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your Shopify store domain to get started
            </p>

            <form onSubmit={handleInstall} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Domain
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="your-store"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    className="flex-1"
                    disabled={isInstalling}
                  />
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    .myshopify.com
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Example: my-awesome-store
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting to Shopify...
                  </>
                ) : (
                  <>
                    Install App
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                You'll be redirected to Shopify to authorize the app
              </p>
            </form>

            {/* Trust Indicators */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">2min</p>
                  <p className="text-xs text-gray-600">Setup Time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">15min</p>
                  <p className="text-xs text-gray-600">First Lead</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">40+</p>
                  <p className="text-xs text-gray-600">Templates</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                What's included:
              </h3>
              <div className="space-y-3">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <p className="text-gray-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-blue-200">/month</span>
              </div>
              <p className="text-blue-100 mb-4">
                Everything you need to grow your email list
              </p>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>✓ Unlimited forms & popups</li>
                <li>✓ Unlimited submissions</li>
                <li>✓ A/B testing included</li>
                <li>✓ All integrations unlocked</li>
              </ul>
            </div>

            {/* Social Proof */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  2,000+ stores
                </span>
              </div>
              <p className="text-sm text-gray-700">
                "Increased our email list by 300% in the first month. The A/B testing helped us find the perfect popup timing."
              </p>
              <p className="text-xs text-gray-600 mt-2">
                — Sarah Chen, Skincare Brand Owner
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Install</h3>
              <p className="text-sm text-gray-600">
                One-click install from Shopify App Store. No code required.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Customize</h3>
              <p className="text-sm text-gray-600">
                Choose a template or use AI to generate your perfect form.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Launch</h3>
              <p className="text-sm text-gray-600">
                Activate your campaign and watch the leads roll in.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}