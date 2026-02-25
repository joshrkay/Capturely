import { describe, it, expect } from 'vitest';
import { selectWinner, type VariantStats } from '../select-winner';

const control: VariantStats = {
  variantId: 'control',
  impressions: 1000,
  submissions: 100,
  isControl: true,
};

const variant: VariantStats = {
  variantId: 'variant-b',
  impressions: 1000,
  submissions: 150,
  isControl: false,
};

describe('selectWinner', () => {
  it('picks higher conversion rate when flag is OFF', () => {
    const result = selectWinner(control, variant, false);
    expect(result.winner_variant_id).toBe('variant-b');
    expect(result.reason).toBe('best_conversion');
    expect(result.is_significant).toBe(false);
  });

  it('picks control when flag is OFF and control has higher CR', () => {
    const weakVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 1000,
      submissions: 50,
      isControl: false,
    };
    const result = selectWinner(control, weakVariant, false);
    expect(result.winner_variant_id).toBe('control');
    expect(result.reason).toBe('best_conversion');
  });

  it('tie goes to control (deterministic)', () => {
    const tiedVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 1000,
      submissions: 100,
      isControl: false,
    };
    const result = selectWinner(control, tiedVariant, false);
    expect(result.winner_variant_id).toBe('control');
    expect(result.reason).toBe('tie_control');
    expect(result.is_significant).toBe(false);
  });

  it('tie goes to control even with significance enabled', () => {
    const tiedVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 1000,
      submissions: 100,
      isControl: false,
    };
    const result = selectWinner(control, tiedVariant, true);
    expect(result.winner_variant_id).toBe('control');
    expect(result.reason).toBe('tie_control');
    expect(result.is_significant).toBe(false);
  });

  it('flag ON + significant difference → reason "significant"', () => {
    // Large difference + large sample → statistically significant
    const bigControl: VariantStats = {
      variantId: 'control',
      impressions: 5000,
      submissions: 250,
      isControl: true,
    };
    const bigVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 5000,
      submissions: 500,
      isControl: false,
    };
    const result = selectWinner(bigControl, bigVariant, true);
    expect(result.winner_variant_id).toBe('variant-b');
    expect(result.reason).toBe('significant');
    expect(result.is_significant).toBe(true);
  });

  it('flag ON + not significant → reason "best_conversion", is_significant false', () => {
    // Very small difference with small sample → not statistically significant
    const smallControl: VariantStats = {
      variantId: 'control',
      impressions: 20,
      submissions: 2,
      isControl: true,
    };
    const smallVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 20,
      submissions: 3,
      isControl: false,
    };
    const result = selectWinner(smallControl, smallVariant, true);
    expect(result.winner_variant_id).toBe('variant-b');
    expect(result.reason).toBe('best_conversion');
    expect(result.is_significant).toBe(false);
  });

  it('handles zero impressions gracefully', () => {
    const zeroControl: VariantStats = {
      variantId: 'control',
      impressions: 0,
      submissions: 0,
      isControl: true,
    };
    const zeroVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 0,
      submissions: 0,
      isControl: false,
    };
    const result = selectWinner(zeroControl, zeroVariant, false);
    expect(result.winner_variant_id).toBe('control');
    expect(result.reason).toBe('tie_control');
  });

  it('handles one variant with 0 impressions (significance enabled)', () => {
    const zeroVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 0,
      submissions: 0,
      isControl: false,
    };
    const result = selectWinner(control, zeroVariant, true);
    expect(result.winner_variant_id).toBe('control');
    expect(result.reason).toBe('best_conversion');
    expect(result.is_significant).toBe(false);
  });

  it('handles 100% conversion rate for both (equal CR)', () => {
    const perfect1: VariantStats = {
      variantId: 'control',
      impressions: 100,
      submissions: 100,
      isControl: true,
    };
    const perfect2: VariantStats = {
      variantId: 'variant-b',
      impressions: 100,
      submissions: 100,
      isControl: false,
    };
    const result = selectWinner(perfect1, perfect2, true);
    expect(result.winner_variant_id).toBe('control');
    expect(result.reason).toBe('tie_control');
  });

  it('control wins significant test when control has higher CR', () => {
    const strongControl: VariantStats = {
      variantId: 'control',
      impressions: 5000,
      submissions: 500,
      isControl: true,
    };
    const weakVariant: VariantStats = {
      variantId: 'variant-b',
      impressions: 5000,
      submissions: 250,
      isControl: false,
    };
    const result = selectWinner(strongControl, weakVariant, true);
    expect(result.winner_variant_id).toBe('control');
    expect(result.reason).toBe('significant');
    expect(result.is_significant).toBe(true);
  });
});
