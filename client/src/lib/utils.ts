import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency
 * Safely handles undefined, null, NaN values
 */
export function formatCurrency(amount: number | undefined | null): string {
  // Default to 0 for falsy or NaN values
  if (!amount || isNaN(amount)) amount = 0;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate percentage completion
 * Safely handles undefined, null, NaN values and prevents division by zero
 */
export function calculatePercentage(current: number | undefined | null, target: number | undefined | null): number {
  // Handle undefined, null, NaN, or zero values
  if (!current || isNaN(current)) return 0;
  if (!target || isNaN(target) || target === 0) return 0;
  
  const percentage = (current / target) * 100;
  return isNaN(percentage) ? 0 : Math.round(percentage);
}

/**
 * Generate user initials from name
 */
export function getUserInitials(name: string): string {
  if (!name) return '';
  
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Truncate text if it exceeds the maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
