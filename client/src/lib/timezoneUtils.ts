import { format, formatInTimeZone } from 'date-fns-tz';

/**
 * Get a list of common timezones with their offsets
 */
export function getTimezones() {
  // Common timezones list with readable names
  return [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    // North America
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
    // Europe
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
    // Africa
    { value: 'Africa/Cairo', label: 'Cairo (EET) - North Africa' },
    { value: 'Africa/Casablanca', label: 'Casablanca (WET) - North Africa' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST) - Southern Africa' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT) - East Africa' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT) - West Africa' },
    { value: 'Africa/Khartoum', label: 'Khartoum (CAT) - Central Africa' },
    { value: 'Africa/Accra', label: 'Accra (GMT) - West Africa' },
    { value: 'Africa/Addis_Ababa', label: 'Addis Ababa (EAT) - East Africa' },
    { value: 'Africa/Algiers', label: 'Algiers (CET) - North Africa' },
    { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (EAT) - East Africa' },
    // Asia
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'China (CST)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    // Australia/Oceania
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  ];
}

/**
 * Get the user's local timezone
 */
export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert time between timezones
 * @param time - Time string in HH:MM format
 * @param fromTimezone - Source timezone
 * @param toTimezone - Target timezone
 * @returns Time string in HH:MM format in the target timezone
 */
export function convertTimeToTimezone(time: string, fromTimezone: string, toTimezone: string): string {
  // Parse the time string (HH:MM)
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date object for today with the specified time
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // Format the time in the target timezone
  return formatInTimeZone(date, toTimezone, 'HH:mm');
}

/**
 * Format time with timezone info for display
 * @param time - Time string in HH:MM format
 * @param timezone - Timezone to display the time in
 * @returns Formatted time string with timezone info
 */
export function formatTimeWithTimezone(time: string, timezone: string): string {
  // Parse the time string (HH:MM)
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date object for today with the specified time
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // Format the time in the specified timezone with timezone name
  return formatInTimeZone(date, timezone, 'h:mm a (zzz)');
}

/**
 * Get the current time in a specific timezone
 * @param timezone - The timezone to get current time for
 * @returns Current time in HH:MM format
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  const now = new Date();
  return formatInTimeZone(now, timezone, 'HH:mm');
}