import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Logo } from '../../components/logo';

export function ShopifyCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying installation...');

  useEffect(() => {
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Installation was cancelled or failed. Please try again.');
      return;
    }

    if (!shop || !code) {
      setStatus('error');
      setMessage('Invalid installation parameters. Please restart the installation process.');
      return;
    }

    // Simulate OAuth token exchange
    // In production, this would make an API call to your backend to:
    // 1. Exchange the code for an access token
    // 2. Store the shop credentials
    // 3. Create a new account or link to existing account
    // 4. Install the app script in the theme
    
    const processInstallation = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Store shop info in localStorage (in production, this would be server-side)
        const shopData = {
          shop,
          accessToken: 'shpat_mock_token_' + Date.now(),
          installedAt: new Date().toISOString(),
          scopes: ['read_products', 'write_script_tags', 'read_customers'],
        };

        localStorage.setItem('shopify_shop', JSON.stringify(shopData));
        localStorage.setItem('platform', 'shopify');

        setStatus('success');
        setMessage('Installation successful!');

        // Redirect to success page
        setTimeout(() => {
          navigate('/auth/shopify/success?shop=' + shop);
        }, 1500);
      } catch (err) {
        setStatus('error');
        setMessage('Failed to complete installation. Please try again.');
      }
    };

    processInstallation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Setting up your account
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
              <div className="mt-6 space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <p>Verifying Shopify credentials</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                  <p>Creating your account</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200" />
                  <p>Installing embed script</p>
                </div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Installation Complete!
              </h2>
              <p className="text-gray-600">
                Redirecting you to complete setup...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Installation Failed
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <button
                onClick={() => navigate('/auth/shopify')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}