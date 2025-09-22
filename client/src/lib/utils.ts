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
 * Detect if a goal is an increase goal (target > starting) or decrease goal (target < starting)
 */
export function isIncreaseGoal(target: number, starting: number = 0): boolean {
  return target > starting;
}

/**
 * Calculate percentage completion for both increase and decrease goals
 * Safely handles undefined, null, NaN values and prevents division by zero
 * 
 * Examples:
 * Increase goal: starting=50, current=55, target=60 means 50% progress (5 out of 10)
 * Decrease goal: starting=100, current=80, target=70 means 67% progress (20 out of 30 reduction)
 */
export function calculatePercentage(current: number | undefined | null, target: number | undefined | null, starting: number | undefined | null = 0): number {
  // Handle undefined, null, NaN values
  if (current === undefined || current === null || isNaN(current)) return 0;
  if (target === undefined || target === null || isNaN(target)) return 0;
  if (starting === undefined || starting === null || isNaN(starting)) starting = 0;
  
  // Handle case where target equals starting (no goal movement)
  if (target === starting) return current === target ? 100 : 0;
  
  const isIncrease = isIncreaseGoal(target, starting);
  
  if (isIncrease) {
    // Increase goal: target > starting
    const progress = current - starting;
    const totalGoal = target - starting;
    const percentage = (progress / totalGoal) * 100;
    return isNaN(percentage) ? 0 : Math.round(percentage);
  } else {
    // Decrease goal: target < starting
    const progress = starting - current; // Progress is reduction from starting
    const totalGoal = starting - target; // Total needed reduction
    const percentage = (progress / totalGoal) * 100;
    return isNaN(percentage) ? 0 : Math.round(percentage);
  }
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
 * Get goal direction text for UI display
 */
export function getGoalDirectionText(target: number, starting: number = 0): string {
  return isIncreaseGoal(target, starting) ? "increase" : "decrease";
}

/**
 * Get progress status text based on goal type and percentage
 */
export function getProgressStatusText(percentage: number, target: number, starting: number = 0): string {
  const isIncrease = isIncreaseGoal(target, starting);
  
  if (percentage >= 100) {
    return isIncrease ? "Target Achieved!" : "Target Reached!";
  }
  
  if (percentage < 0) {
    return isIncrease ? "Below Starting Point" : "Above Starting Point";
  }
  
  return isIncrease ? "Progress Toward Target" : "Progress Toward Target";
}

/**
 * Truncate text if it exceeds the maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
