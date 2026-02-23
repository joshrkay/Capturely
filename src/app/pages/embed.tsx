import { useState } from 'react';
import { Copy, Check, Code, Globe, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { generateId } from '../lib/utils';

export function Embed() {
  const [copied, setCopied] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  
  // In production, this would be the user's actual API key
  const apiKey = 'fbk_' + generateId();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const standardScript = `<!-- Capturely Embed Script -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.capturely.app/embed.js';
    script.async = true;
    script.setAttribute('data-api-key', '${apiKey}');
    document.head.appendChild(script);
  })();
</script>`;

  const wordPressInstructions = `1. Install the "Insert Headers and Footers" plugin
2. Go to Settings → Insert Headers and Footers
3. Paste the script in the "Scripts in Header" section
4. Click "Save"

Alternative: Add directly to your theme's header.php before </head>`;

  const shopifyInstructions = `1. From your Shopify admin, go to Online Store → Themes
2. Click "Actions" → "Edit code"
3. Open theme.liquid file
4. Paste the script before the closing </head> tag
5. Click "Save"

Recommended: Use our Shopify app for easier installation`;

  const htmlScript = `<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  ${standardScript}
</head>
<body>
  <!-- Your content -->
</body>
</html>`;

  const reactScript = `// In your main App.js or index.js
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.capturely.app/embed.js';
  script.async = true;
  script.setAttribute('data-api-key', '${apiKey}');
  document.head.appendChild(script);

  return () => {
    document.head.removeChild(script);
  };
}, []);`;

  const platforms = [
    {
      name: 'Shopify',
      icon: '🛍️',
      description: 'E-commerce platform',
      hasApp: true,
    },
    {
      name: 'WordPress',
      icon: '📝',
      description: 'Content management system',
      hasApp: true,
    },
    {
      name: 'Wix',
      icon: '🎨',
      description: 'Website builder',
      hasApp: false,
    },
    {
      name: 'Squarespace',
      icon: '⬛',
      description: 'Website builder',
      hasApp: false,
    },
    {
      name: 'Webflow',
      icon: '🌊',
      description: 'Visual website builder',
      hasApp: false,
    },
    {
      name: 'Custom HTML',
      icon: '💻',
      description: 'Any website',
      hasApp: false,
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Install Embed Script</h1>
        <p className="text-gray-600">
          Add Capturely to your website with a simple code snippet
        </p>
      </div>

      {/* Platform Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <Card
              key={platform.name}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{platform.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                  <p className="text-xs text-gray-600">{platform.description}</p>
                  {platform.hasApp && (
                    <div className="mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Native App Available
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Installation Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="universal">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="universal">Universal</TabsTrigger>
            <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
            <TabsTrigger value="react">React/Next.js</TabsTrigger>
          </TabsList>

          {/* Universal Script */}
          <TabsContent value="universal" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Universal Embed Script
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Works on any website. Paste this code in your HTML <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section.
              </p>

              <div className="bg-gray-900 rounded-lg p-4 relative">
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  <code>{standardScript}</code>
                </pre>
                <button
                  onClick={() => handleCopy(standardScript, 'standard')}
                  className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copied === 'standard' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Installation Tips</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Place the script as high as possible in the <code className="bg-white px-1 py-0.5 rounded text-xs">&lt;head&gt;</code></li>
                    <li>• The script loads asynchronously and won't block page rendering</li>
                    <li>• Your forms will automatically appear based on display rules</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* WordPress */}
          <TabsContent value="wordpress" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                WordPress Installation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Two ways to install on WordPress
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Recommended: WordPress Plugin</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Install our official WordPress plugin for the easiest setup
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Download WordPress Plugin
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Manual Installation</h4>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                    {wordPressInstructions}
                  </pre>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    <code>{standardScript}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(standardScript, 'wordpress')}
                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {copied === 'wordpress' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Shopify */}
          <TabsContent value="shopify" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Shopify Installation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose your installation method
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Recommended: Shopify App</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    One-click installation from the Shopify App Store
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Install Shopify App
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Manual Theme Installation</h4>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                    {shopifyInstructions}
                  </pre>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    <code>{standardScript}</code>
                  </pre>
                  <button
                    onClick={() => handleCopy(standardScript, 'shopify')}
                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {copied === 'shopify' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* React/Next.js */}
          <TabsContent value="react" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                React / Next.js Installation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add Capturely to your React or Next.js application
              </p>

              <div className="bg-gray-900 rounded-lg p-4 relative">
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  <code>{reactScript}</code>
                </pre>
                <button
                  onClick={() => handleCopy(reactScript, 'react')}
                  className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {copied === 'react' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Next.js Specific</h4>
                <p className="text-sm text-gray-700">
                  For Next.js, add this to your <code className="bg-white px-1 py-0.5 rounded text-xs">_app.js</code> or{' '}
                  <code className="bg-white px-1 py-0.5 rounded text-xs">layout.js</code> (App Router) component.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Verification */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Verify Installation
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          After adding the script, verify it's working correctly
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              1
            </div>
            <p className="text-gray-700">Open your website in a browser</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              2
            </div>
            <p className="text-gray-700">Open browser console (F12) and look for "FormBuilder initialized"</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
              3
            </div>
            <p className="text-gray-700">Create and activate a campaign to see it appear</p>
          </div>
        </div>
      </Card>
    </div>
  );
}