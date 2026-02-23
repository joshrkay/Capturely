import { Shield, AlertTriangle, Check } from 'lucide-react';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { SpamProtection } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface SpamProtectionSettingsProps {
  spamProtection: SpamProtection;
  onUpdate: (updates: Partial<SpamProtection>) => void;
}

export function SpamProtectionSettings({ spamProtection, onUpdate }: SpamProtectionSettingsProps) {
  const protectionLevel = () => {
    let score = 0;
    if (spamProtection.enabled) score++;
    if (spamProtection.honeypot) score++;
    if (spamProtection.reCaptcha?.enabled) score++;
    if (spamProtection.emailVerification) score++;
    if (spamProtection.rateLimit?.enabled) score++;
    
    if (score >= 4) return { level: 'High', color: 'text-green-600 bg-green-50', icon: <Check className="w-4 h-4" /> };
    if (score >= 2) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50', icon: <AlertTriangle className="w-4 h-4" /> };
    return { level: 'Low', color: 'text-red-600 bg-red-50', icon: <AlertTriangle className="w-4 h-4" /> };
  };

  const protection = protectionLevel();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Spam Protection</h3>
        <p className="text-sm text-gray-600">Protect your forms from spam and malicious submissions</p>
      </div>

      {/* Protection Level Indicator */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Protection Level</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${protection.color}`}>
                  {protection.level}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label className="text-sm font-semibold text-gray-900">Enable Spam Protection</Label>
          <p className="text-xs text-gray-600 mt-1">Turn on basic spam filtering</p>
        </div>
        <button
          onClick={() => onUpdate({ enabled: !spamProtection.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            spamProtection.enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              spamProtection.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {spamProtection.enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-blue-200">
          {/* Honeypot */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-900">Honeypot Field</Label>
              <p className="text-xs text-gray-600 mt-1">
                Hidden field that catches bots (recommended)
              </p>
            </div>
            <button
              onClick={() => onUpdate({ honeypot: !spamProtection.honeypot })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                spamProtection.honeypot ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  spamProtection.honeypot ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* reCAPTCHA */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900">Google reCAPTCHA</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Advanced bot detection (requires API key)
                </p>
              </div>
              <button
                onClick={() => onUpdate({ 
                  reCaptcha: { 
                    ...spamProtection.reCaptcha,
                    enabled: !spamProtection.reCaptcha?.enabled 
                  } 
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  spamProtection.reCaptcha?.enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    spamProtection.reCaptcha?.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {spamProtection.reCaptcha?.enabled && (
              <div>
                <Label className="text-xs text-gray-700 mb-1">Site Key</Label>
                <Input
                  type="text"
                  placeholder="6Lc..."
                  value={spamProtection.reCaptcha?.siteKey || ''}
                  onChange={(e) => onUpdate({
                    reCaptcha: {
                      ...spamProtection.reCaptcha,
                      enabled: true,
                      siteKey: e.target.value
                    }
                  })}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* Email Verification */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-900">Email Verification</Label>
              <p className="text-xs text-gray-600 mt-1">
                Require users to verify their email address
              </p>
            </div>
            <button
              onClick={() => onUpdate({ emailVerification: !spamProtection.emailVerification })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                spamProtection.emailVerification ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  spamProtection.emailVerification ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Rate Limiting */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-900">Rate Limiting</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Limit number of submissions per time period
                </p>
              </div>
              <button
                onClick={() => onUpdate({ 
                  rateLimit: { 
                    ...spamProtection.rateLimit,
                    enabled: !spamProtection.rateLimit?.enabled,
                    maxSubmissions: spamProtection.rateLimit?.maxSubmissions || 5,
                    timeWindow: spamProtection.rateLimit?.timeWindow || 60
                  } 
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  spamProtection.rateLimit?.enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    spamProtection.rateLimit?.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {spamProtection.rateLimit?.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-700 mb-1">Max Submissions</Label>
                  <Input
                    type="number"
                    min="1"
                    value={spamProtection.rateLimit?.maxSubmissions || 5}
                    onChange={(e) => onUpdate({
                      rateLimit: {
                        ...spamProtection.rateLimit,
                        enabled: true,
                        maxSubmissions: parseInt(e.target.value),
                        timeWindow: spamProtection.rateLimit?.timeWindow || 60
                      }
                    })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-700 mb-1">Time Window (min)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={spamProtection.rateLimit?.timeWindow || 60}
                    onChange={(e) => onUpdate({
                      rateLimit: {
                        ...spamProtection.rateLimit,
                        enabled: true,
                        maxSubmissions: spamProtection.rateLimit?.maxSubmissions || 5,
                        timeWindow: parseInt(e.target.value)
                      }
                    })}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
