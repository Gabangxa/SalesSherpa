import { DateTime, Duration, IANAZone, Info } from 'luxon';

/**
 * Enhanced timezone utility using Luxon
 * Provides comprehensive timezone handling for the application
 */

interface TimeInfo {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

/**
 * Get timezone-adjusted current time
 * 
 * @param timezone IANA timezone identifier (e.g., 'Africa/Johannesburg')
 * @returns Current DateTime in the specified timezone
 */
export function getCurrentTimeInTimezone(timezone: string): DateTime {
  try {
    // Validate the timezone
    if (!IANAZone.isValidZone(timezone)) {
      console.warn(`Invalid timezone: ${timezone}, falling back to local timezone`);
      return DateTime.local();
    }
    
    return DateTime.now().setZone(timezone);
  } catch (error) {
    console.error('Error getting current time in timezone:', error);
    return DateTime.local();
  }
}

/**
 * Check if a time string is valid in the 24-hour format (HH:MM)
 * 
 * @param timeString Time string in 24-hour format (e.g., "14:30")
 * @returns True if the time string is valid
 */
export function isValidTimeString(timeString: string): boolean {
  if (!timeString) return false;
  
  const pattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return pattern.test(timeString);
}

/**
 * Parse a time string into hours and minutes
 * 
 * @param timeString Time string in 24-hour format (e.g., "14:30")
 * @returns Object with hours, minutes, and total minutes
 */
export function parseTimeString(timeString: string): TimeInfo | null {
  if (!isValidTimeString(timeString)) return null;
  
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes
  };
}

/**
 * Convert a DateTime object to a time string
 * 
 * @param dateTime Luxon DateTime object
 * @returns Time string in 24-hour format (e.g., "14:30")
 */
export function formatTimeString(dateTime: DateTime): string {
  return dateTime.toFormat('HH:mm');
}

/**
 * Convert a time string from one timezone to another
 * 
 * @param timeString Time string in 24-hour format (e.g., "14:30")
 * @param fromTimezone Source timezone
 * @param toTimezone Target timezone
 * @returns Converted time string
 */
export function convertTimeZone(
  timeString: string,
  fromTimezone: string,
  toTimezone: string
): string {
  if (!isValidTimeString(timeString)) return timeString;
  
  try {
    // Validate the timezones
    if (!IANAZone.isValidZone(fromTimezone) || !IANAZone.isValidZone(toTimezone)) {
      console.warn('Invalid timezone provided, returning original time');
      return timeString;
    }
    
    const { hours, minutes } = parseTimeString(timeString)!;
    
    // Create a DateTime object with today's date and the given time in the source timezone
    const dt = DateTime.now()
      .setZone(fromTimezone)
      .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    // Convert to the target timezone
    const convertedDt = dt.setZone(toTimezone);
    
    return formatTimeString(convertedDt);
  } catch (error) {
    console.error('Error converting timezone:', error);
    return timeString;
  }
}

/**
 * Calculate the time difference between two timezones
 * 
 * @param timezone1 First timezone
 * @param timezone2 Second timezone
 * @returns Duration object representing the difference
 */
export function getTimezoneDifference(timezone1: string, timezone2: string): Duration {
  try {
    // Validate the timezones
    if (!IANAZone.isValidZone(timezone1) || !IANAZone.isValidZone(timezone2)) {
      console.warn('Invalid timezone provided, returning zero difference');
      return Duration.fromMillis(0);
    }
    
    const now = DateTime.now();
    const time1 = now.setZone(timezone1);
    const time2 = now.setZone(timezone2);
    
    return time1.diff(time2);
  } catch (error) {
    console.error('Error calculating timezone difference:', error);
    return Duration.fromMillis(0);
  }
}

/**
 * Format a duration as a string
 * 
 * @param duration Luxon Duration object
 * @returns Formatted string (e.g., "+02:00" or "-05:30")
 */
export function formatDuration(duration: Duration): string {
  const isNegative = duration.milliseconds < 0;
  const absDuration = isNegative ? duration.negate() : duration;
  
  const hours = Math.floor(absDuration.as('hours'));
  const minutes = Math.floor(absDuration.as('minutes') % 60);
  
  const sign = isNegative ? '-' : '+';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Check if a time is within a certain margin of current time
 * 
 * @param timeString Time string to check
 * @param timezone Timezone of the time string
 * @param marginMinutes Margin in minutes (default: 5)
 * @returns True if the time is within the margin of current time
 */
export function isTimeWithinMargin(
  timeString: string,
  timezone: string,
  marginMinutes: number = 5
): boolean {
  if (!isValidTimeString(timeString)) return false;
  
  try {
    const { hours, minutes, totalMinutes } = parseTimeString(timeString)!;
    
    // Get current time in the specified timezone
    const now = getCurrentTimeInTimezone(timezone);
    const currentTotalMinutes = now.hour * 60 + now.minute;
    
    // Calculate the difference in minutes
    const diffMinutes = Math.abs(totalMinutes - currentTotalMinutes);
    
    // Check if the difference is within the margin
    // Also considering day wraparound (near midnight)
    const withinMargin = 
      diffMinutes <= marginMinutes || 
      (1440 - diffMinutes) <= marginMinutes; // 1440 = 24*60 minutes in a day
    
    return withinMargin;
  } catch (error) {
    console.error('Error checking if time is within margin:', error);
    return false;
  }
}

/**
 * Get a list of all supported timezones by country or region
 * 
 * @param country Optional country or region to filter (e.g., 'Africa')
 * @returns Array of IANA timezone identifiers
 */
export function getAvailableTimezones(country?: string): string[] {
  try {
    const allZones = Info.getIANAZones();
    
    if (!country) {
      return allZones;
    }
    
    // Filter zones by country or region
    return allZones.filter(zone => zone.includes(country));
  } catch (error) {
    console.error('Error getting available timezones:', error);
    return [];
  }
}

/**
 * Get the user's browser timezone
 * 
 * @returns The detected browser timezone
 */
export function getBrowserTimezone(): string {
  return DateTime.local().zoneName;
}

/**
 * Format a date in a localized format based on the specified timezone
 * 
 * @param date Date to format
 * @param timezone Timezone to use
 * @param format Optional format string (default: 'full')
 * @returns Formatted date string
 */
export function formatDateInTimezone(
  date: Date,
  timezone: string,
  format: 'full' | 'long' | 'medium' | 'short' = 'medium'
): string {
  try {
    if (!IANAZone.isValidZone(timezone)) {
      console.warn(`Invalid timezone: ${timezone}, falling back to local timezone`);
      return DateTime.fromJSDate(date).toLocaleString(DateTime[format + 'DateTime']);
    }
    
    return DateTime.fromJSDate(date)
      .setZone(timezone)
      .toLocaleString(DateTime[format + 'DateTime' as keyof typeof DateTime]);
  } catch (error) {
    console.error('Error formatting date in timezone:', error);
    return date.toLocaleString();
  }
}

export default {
  getCurrentTimeInTimezone,
  isValidTimeString,
  parseTimeString,
  formatTimeString,
  convertTimeZone,
  getTimezoneDifference,
  formatDuration,
  isTimeWithinMargin,
  getAvailableTimezones,
  getBrowserTimezone,
  formatDateInTimezone
};