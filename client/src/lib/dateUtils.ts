import { format, isToday, isYesterday, addDays, parseISO, isBefore, isAfter, isWithinInterval } from 'date-fns';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  } else if (isYesterday(dateObj)) {
    return 'Yesterday';
  } else {
    return format(dateObj, 'MMM d, yyyy');
  }
}

/**
 * Format a date with day of week
 */
export function formatDateWithDay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEEE, MMMM d, yyyy');
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'h:mm a');
}

/**
 * Get appropriate greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Check if a date is within a time off period
 */
export function isTimeOff(date: Date, timeOffPeriods: { startDate: string; endDate: string }[]): boolean {
  return timeOffPeriods.some(period => {
    const start = parseISO(period.startDate);
    const end = parseISO(period.endDate);
    return isWithinInterval(date, { start, end });
  });
}

/**
 * Get dates for the next 7 days
 */
export function getNextSevenDays(): Date[] {
  const result = [];
  for (let i = 0; i < 7; i++) {
    result.push(addDays(new Date(), i));
  }
  return result;
}
