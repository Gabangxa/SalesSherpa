import { formatCurrency } from './utils';

/**
 * Shared utility functions for goal management
 */

// Category colors for progress bars and UI elements
export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'sales':
      return 'bg-primary';
    case 'meetings':
      return 'bg-blue-500';
    case 'leads':
      return 'bg-green-500';
    case 'revenue':
      return 'bg-amber-500';
    case 'clients':
      return 'bg-purple-500';
    case 'accounts':
      return 'bg-cyan-500';
    case 'activities':
      return 'bg-rose-500';
    default:
      return 'bg-primary';
  }
};

// Category gradient colors for dashboard components
export const getCategoryGradient = (category: string) => {
  switch (category) {
    case 'sales':
      return 'from-emerald-500 to-teal-500';
    case 'meetings':
      return 'from-blue-500 to-indigo-500';
    case 'leads':
      return 'from-green-500 to-emerald-500';
    case 'revenue':
      return 'from-amber-500 to-orange-500';
    case 'clients':
      return 'from-purple-500 to-pink-500';
    case 'accounts':
      return 'from-cyan-500 to-blue-500';
    case 'activities':
      return 'from-rose-500 to-red-500';
    default:
      return 'from-slate-500 to-gray-500';
  }
};

// Format category label with proper capitalization
export const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

// Format goal values based on type
export const formatGoalValue = (amount: number, valueType: string) => {
  switch (valueType) {
    case 'monetary':
      return formatCurrency(amount);
    case 'percentage':
      return `${amount}%`;
    case 'number':
    default:
      return amount.toString();
  }
};

// Available goal categories
export const GOAL_CATEGORIES = [
  { value: "sales", label: "Sales" },
  { value: "meetings", label: "Meetings" },
  { value: "leads", label: "Leads" },
  { value: "revenue", label: "Revenue" },
  { value: "clients", label: "Clients" },
  { value: "accounts", label: "Accounts" },
  { value: "activities", label: "Activities" },
];

// Get badge color based on completion percentage
export const getBadgeColor = (percentage: number) => {
  if (percentage >= 90) return "accent";
  if (percentage >= 70) return "primary";
  return "secondary";
};

// Get field labels for different value types
export const getFieldLabels = (valueType: string) => {
  switch (valueType) {
    case 'monetary':
      return {
        target: 'Target Amount ($)',
        current: 'Current Amount ($)',
        starting: 'Starting Amount ($)',
        targetDesc: 'The dollar amount you aim to achieve',
        currentDesc: 'Your current progress in dollars',
        startingDesc: 'The baseline amount you started from'
      };
    case 'percentage':
      return {
        target: 'Target Percentage (%)',
        current: 'Current Percentage (%)',
        starting: 'Starting Percentage (%)',
        targetDesc: 'The percentage you aim to achieve (e.g., 60 for 60%)',
        currentDesc: 'Your current percentage (e.g., 55 for 55%)',
        startingDesc: 'The baseline percentage you started from (e.g., 50 for 50%)'
      };
    case 'number':
    default:
      return {
        target: 'Target Number',
        current: 'Current Number',
        starting: 'Starting Number',
        targetDesc: 'The number you aim to achieve (e.g., 10 meetings)',
        currentDesc: 'Your current count toward the goal',
        startingDesc: 'The baseline number you started from'
      };
  }
};