import { TrendingUp, AlertCircle, CheckCircle2, Trophy } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { VariantMetrics } from '../types';

interface StatisticalSignificanceProps {
  variants: VariantMetrics[];
  totalViews: number;
}

export function StatisticalSignificance({ variants, totalViews }: StatisticalSignificanceProps) {
  // Calculate statistical significance
  const calculateSignificance = () => {
    // Add null/undefined check
    if (!variants || variants.length < 2) {
      return {
        hasEnoughData: false,
        confidenceLevel: 0,
        recommendedAction: variants?.length === 1 ? 'Add a variant to start A/B testing' : 'Add variants to start A/B testing',
        samplesNeeded: 0,
        winningVariant: null
      };
    }

    const control = variants.find(v => v.variantName.toLowerCase().includes('control')) || variants[0];
    const challenger = variants.find(v => v !== control) || variants[1];

    if (!control || !challenger) {
      return {
        hasEnoughData: false,
        confidenceLevel: 0,
        recommendedAction: 'Need at least 2 variants',
        samplesNeeded: 0,
        winningVariant: null
      };
    }

    // Minimum sample size needed (simplified)
    const minSampleSize = 100;
    const totalSamples = control.views + challenger.views;
    
    if (totalSamples < minSampleSize) {
      return {
        hasEnoughData: false,
        confidenceLevel: 0,
        recommendedAction: `Collect more data`,
        samplesNeeded: minSampleSize - totalSamples,
        winningVariant: null
      };
    }

    // Simplified z-test for conversion rates
    const p1 = control.submissions / control.views;
    const p2 = challenger.submissions / challenger.views;
    
    const pooledP = (control.submissions + challenger.submissions) / (control.views + challenger.views);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/control.views + 1/challenger.views));
    
    if (se === 0) {
      return {
        hasEnoughData: false,
        confidenceLevel: 0,
        recommendedAction: 'Need more conversions',
        samplesNeeded: 50,
        winningVariant: null
      };
    }
    
    const zScore = Math.abs((p1 - p2) / se);
    
    // Convert z-score to confidence level (simplified)
    let confidenceLevel = 0;
    if (zScore > 2.576) confidenceLevel = 99; // 99% confidence
    else if (zScore > 1.96) confidenceLevel = 95; // 95% confidence
    else if (zScore > 1.645) confidenceLevel = 90; // 90% confidence
    else confidenceLevel = Math.min(85, Math.round(zScore * 40));

    const hasEnoughData = confidenceLevel >= 95;
    const winningVariant = p2 > p1 ? challenger : control;
    const lift = ((Math.max(p1, p2) / Math.min(p1, p2)) - 1) * 100;

    let recommendedAction = '';
    if (hasEnoughData) {
      recommendedAction = `${winningVariant.variantName} is winning with ${lift.toFixed(1)}% lift. Consider making it the default.`;
    } else if (confidenceLevel >= 85) {
      recommendedAction = `${winningVariant.variantName} is leading but needs more data for 95% confidence.`;
    } else {
      recommendedAction = 'Keep testing - results are too close to call.';
    }

    return {
      hasEnoughData,
      confidenceLevel: Math.round(confidenceLevel),
      recommendedAction,
      samplesNeeded: hasEnoughData ? 0 : Math.max(50, Math.round((minSampleSize - totalSamples) * 1.5)),
      winningVariant: hasEnoughData ? winningVariant : null
    };
  };

  const stats = calculateSignificance();

  const getStatusColor = () => {
    if (stats.confidenceLevel >= 95) return 'text-green-600 bg-green-50';
    if (stats.confidenceLevel >= 85) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = () => {
    if (stats.confidenceLevel >= 95) return <CheckCircle2 className="w-5 h-5" />;
    if (stats.confidenceLevel >= 85) return <TrendingUp className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Statistical Significance
          </h3>
          <p className="text-sm text-gray-600">
            A/B test results and confidence analysis
          </p>
        </div>
        <div className={`p-3 rounded-xl ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
      </div>

      {/* Confidence Level */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Confidence Level</span>
          <span className="text-2xl font-bold text-gray-900">{stats.confidenceLevel}%</span>
        </div>
        <Progress value={stats.confidenceLevel} className="h-3" />
        <p className="text-xs text-gray-500 mt-2">
          {stats.confidenceLevel >= 95 && '✓ High confidence - Results are statistically significant'}
          {stats.confidenceLevel >= 85 && stats.confidenceLevel < 95 && '⚡ Moderate confidence - Almost there'}
          {stats.confidenceLevel < 85 && '⏳ Low confidence - Keep collecting data'}
        </p>
      </div>

      {/* Winning Variant */}
      {stats.winningVariant && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">Winner Detected</span>
          </div>
          <p className="text-sm text-green-800">
            <strong>{stats.winningVariant.variantName}</strong> is performing significantly better with a conversion rate of{' '}
            <strong>{stats.winningVariant.conversionRate.toFixed(2)}%</strong>
          </p>
        </div>
      )}

      {/* Samples Needed */}
      {!stats.hasEnoughData && stats.samplesNeeded > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">More data needed</p>
              <p className="text-xs text-blue-700 mt-1">
                Approximately <strong>{stats.samplesNeeded} more views</strong> required for 95% confidence
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              +{stats.samplesNeeded}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendation</h4>
        <p className="text-sm text-gray-700">{stats.recommendedAction}</p>
      </div>

      {/* Variant Comparison */}
      {variants && variants.length >= 2 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Variant Performance</h4>
          <div className="space-y-3">
            {variants.map((variant) => (
              <div key={variant.variantId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {variant.variantName}
                  </span>
                  {stats.winningVariant?.variantId === variant.variantId && (
                    <Badge className="bg-green-100 text-green-800">Winner</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {variant.conversionRate.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {variant.submissions}/{variant.views}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}