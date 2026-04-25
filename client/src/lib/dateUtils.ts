import { format, isToday, isYesterday, addDays, parseISO, isBefore, isAfter, isWithinInterval, isValid } from 'date-fns';

function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? d : null;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  const d = toDate(date);
  if (!d) return '—';
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function formatDateWithDay(date: Date | string | null | undefined): string {
  const d = toDate(date);
  return d ? format(d, 'EEEE, MMMM d, yyyy') : '—';
}

export function formatTime(date: Date | string | null | undefined): string {
  const d = toDate(date);
  return d ? format(d, 'h:mm a') : '—';
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
