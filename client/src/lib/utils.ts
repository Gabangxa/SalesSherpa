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
 * Calculate percentage completion accounting for starting amount
 * Safely handles undefined, null, NaN values and prevents division by zero
 * For example: starting=50, current=55, target=60 means 50% progress toward goal (5 out of 10)
 */
export function calculatePercentage(current: number | undefined | null, target: number | undefined | null, starting: number | undefined | null = 0): number {
  // Handle undefined, null, NaN values
  if (current === undefined || current === null || isNaN(current)) return 0;
  if (target === undefined || target === null || isNaN(target)) return 0;
  if (starting === undefined || starting === null || isNaN(starting)) starting = 0;
  
  // Ensure logical values
  if (target <= starting) return 0; // Target must be greater than starting
  if (current <= starting) return 0; // Current cannot be less than starting
  
  // Calculate progress as percentage of the gap between starting and target
  const progress = current - starting;
  const totalGoal = target - starting;
  
  const percentage = (progress / totalGoal) * 100;
  return isNaN(percentage) ? 0 : Math.min(100, Math.round(percentage));
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
