// Utility functions
import { Submission } from '../types';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (num: number, decimals: number = 2): string => {
  return `${num.toFixed(decimals)}%`;
};

export const exportToCSV = (submissions: Submission[], filename: string): void => {
  if (submissions.length === 0) return;
  
  // Get all unique field names
  const fieldNames = new Set<string>();
  submissions.forEach(sub => {
    Object.keys(sub.data).forEach(key => fieldNames.add(key));
  });
  
  // Build CSV
  const headers = ['ID', 'Timestamp', 'Variant', ...Array.from(fieldNames)];
  const rows = submissions.map(sub => [
    sub.id,
    formatDate(sub.timestamp),
    sub.variantId,
    ...Array.from(fieldNames).map(field => {
      const value = sub.data[field];
      if (Array.isArray(value)) return value.join('; ');
      return value || '';
    })
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};
