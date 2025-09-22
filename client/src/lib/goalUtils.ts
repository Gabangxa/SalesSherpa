import { formatCurrency, isIncreaseGoal, getGoalDirectionText } from './utils';

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

// Get badge color based on completion percentage and goal direction
export const getBadgeColor = (percentage: number, target?: number, starting?: number) => {
  // For goals where we can determine direction, use enhanced logic
  if (target !== undefined && starting !== undefined) {
    const isIncrease = isIncreaseGoal(target, starting);
    
    if (percentage >= 100) return "accent"; // Goal achieved
    if (percentage >= 70) return "primary"; // Good progress
    if (percentage < 0) return "destructive"; // Moving in wrong direction
    return "secondary"; // Some progress
  }
  
  // Fallback to original logic for backwards compatibility
  if (percentage >= 90) return "accent";
  if (percentage >= 70) return "primary";
  return "secondary";
};

// Get field labels for different value types with goal direction awareness
export const getFieldLabels = (valueType: string, targetAmount?: number, startingAmount?: number) => {
  const isIncrease = targetAmount !== undefined && startingAmount !== undefined ? 
    isIncreaseGoal(targetAmount, startingAmount) : true;
  const direction = getGoalDirectionText(targetAmount || 0, startingAmount || 0);
  
  switch (valueType) {
    case 'monetary':
      return {
        target: isIncrease ? 'Target Amount ($)' : 'Target Amount ($)',
        current: 'Current Amount ($)',
        starting: 'Starting Amount ($)',
        targetDesc: isIncrease 
          ? 'The dollar amount you aim to achieve' 
          : 'The target dollar amount you want to reduce to',
        currentDesc: 'Your current amount in dollars',
        startingDesc: isIncrease 
          ? 'The baseline amount you started from' 
          : 'The initial amount you want to reduce from'
      };
    case 'percentage':
      return {
        target: isIncrease ? 'Target Percentage (%)' : 'Target Percentage (%)',
        current: 'Current Percentage (%)',
        starting: 'Starting Percentage (%)',
        targetDesc: isIncrease 
          ? 'The percentage you aim to achieve (e.g., 60 for 60%)' 
          : 'The target percentage you want to reduce to (e.g., 40 for 40%)',
        currentDesc: 'Your current percentage (e.g., 55 for 55%)',
        startingDesc: isIncrease 
          ? 'The baseline percentage you started from (e.g., 50 for 50%)' 
          : 'The initial percentage you want to reduce from (e.g., 60 for 60%)'
      };
    case 'number':
    default:
      return {
        target: isIncrease ? 'Target Number' : 'Target Number',
        current: 'Current Number',
        starting: 'Starting Number',
        targetDesc: isIncrease 
          ? 'The number you aim to achieve (e.g., 10 meetings)' 
          : 'The target number you want to reduce to (e.g., 5 meetings)',
        currentDesc: 'Your current count',
        startingDesc: isIncrease 
          ? 'The baseline number you started from' 
          : 'The initial number you want to reduce from'
      };
  }
};

// Get progress display text based on goal direction
export const getProgressDisplayText = (percentage: number, target: number, starting: number = 0): string => {
  const isIncrease = isIncreaseGoal(target, starting);
  
  if (percentage >= 100) {
    return isIncrease ? "Complete" : "Target Reached";
  }
  
  if (percentage < 0) {
    return isIncrease ? "Below Starting Point" : "Above Starting Point";
  }
  
  return `${percentage}% ${isIncrease ? "toward target" : "reduced"}`;
};

// Get appropriate color for progress based on goal direction and percentage
export const getProgressColor = (percentage: number, target: number, starting: number = 0): string => {
  const isIncrease = isIncreaseGoal(target, starting);
  
  if (percentage >= 100) {
    return "text-green-600"; // Success
  }
  
  if (percentage < 0) {
    return "text-red-600"; // Warning - moved in wrong direction
  }
  
  if (percentage >= 70) {
    return "text-green-600"; // Good progress
  }
  
  if (percentage >= 30) {
    return "text-yellow-600"; // Some progress
  }
  
  return "text-gray-600"; // Minimal progress
};