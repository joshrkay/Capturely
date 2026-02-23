import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { CheckCircle2, Sparkles, Copy, Check, ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { toast } from 'sonner';
import { Logo } from '../../components/logo';

export function ShopifySuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shop = searchParams.get('shop') || 'your-store.myshopify.com';
  const [copied, setCopied] = useState(false);

  const embedScript = `<!-- Capturely for Shopify -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.capturely.app/embed.js';
    script.async = true;
    script.setAttribute('data-shop', '${shop}');
    document.head.appendChild(script);
  })();
</script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    toast.success('Embed script copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGetStarted = () => {
    navigate('/templates');
  };

  const steps = [
    {
      number: 1,
      title: 'Choose a Template',
      description: 'Browse 40+ pre-built templates or use AI to generate your perfect form',
      action: 'Browse Templates',
      onClick: () => navigate('/templates'),
    },
    {
      number: 2,
      title: 'Customize Your Form',
      description: 'Use our drag-and-drop builder to match your brand',
      action: 'Open Builder',
      onClick: () => navigate('/templates'),
    },
    {
      number: 3,
      title: 'Launch Campaign',
      description: 'Set display rules and activate your form on your store',
      action: 'View Guide',
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to Capturely! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your Shopify store is now connected
          </p>
          <p className="text-sm text-gray-500">
            {shop}
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card className="p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Start Guide</h2>
              <p className="text-sm text-gray-600">Get your first form live in 15 minutes</p>
            </div>
          </div>

          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={step.onClick}
                >
                  {step.action}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Button
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Your First Campaign
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Embed Script (Auto-installed, but showing for reference) */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Embed Script</h3>
              <p className="text-sm text-gray-600">
                ✓ Auto-installed in your theme
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Active
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 relative">
            <pre className="text-xs text-gray-300 overflow-x-auto">
              <code>{embedScript}</code>
            </pre>
            <button
              onClick={handleCopyScript}
              className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            This script has been automatically added to your Shopify theme. You don't need to do anything!
          </p>
        </Card>

        {/* Resources */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <PlayCircle className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Watch Tutorial</h3>
            <p className="text-sm text-gray-600 mb-4">
              5-minute video walkthrough of creating your first popup
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Watch Now
            </Button>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Try AI Generator</h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe your form and let AI build it for you instantly
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/?ai=true')}
            >
              Generate Form
            </Button>
          </Card>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="mailto:support@capturely.app" className="text-blue-600 hover:underline">
              Contact our support team
            </a>{' '}
          </p>
        </div>
      </div>
    </div>
  );
}