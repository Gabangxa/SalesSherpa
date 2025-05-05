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
 * Enhanced with additional validation to prevent NaN issues
 * 
 * @param timeString Time string in 24-hour format (e.g., "14:30")
 * @returns Object with hours, minutes, and total minutes
 */
export function parseTimeString(timeString: string): TimeInfo | null {
  if (!timeString || typeof timeString !== 'string' || !isValidTimeString(timeString)) {
    return null;
  }
  
  try {
    const [hoursStr, minutesStr] = timeString.split(':');
    
    if (!hoursStr || !minutesStr) {
      console.warn(`Invalid time string format: ${timeString}`);
      return null;
    }
    
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    // Additional validation after parsing
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn(`Invalid time components: hours=${hours}, minutes=${minutes}`);
      return null;
    }
    
    return {
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes
    };
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
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
 * Enhanced with additional validation to prevent NaN issues
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
  if (!timeString || !isValidTimeString(timeString)) return timeString;
  
  try {
    // Validate the timezones
    if (!fromTimezone || !toTimezone || 
        !IANAZone.isValidZone(fromTimezone) || 
        !IANAZone.isValidZone(toTimezone)) {
      console.warn(`Invalid timezone provided: from=${fromTimezone}, to=${toTimezone}`);
      return timeString;
    }
    
    // If timezones are the same, no conversion needed
    if (fromTimezone === toTimezone) {
      return timeString;
    }
    
    const timeInfo = parseTimeString(timeString);
    if (!timeInfo) {
      console.warn(`Failed to parse time string: ${timeString}`);
      return timeString;
    }
    
    const { hours, minutes } = timeInfo;
    
    // Create a DateTime object with today's date and the given time in the source timezone
    const dt = DateTime.now()
      .setZone(fromTimezone)
      .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    if (!dt.isValid) {
      console.warn('Created invalid DateTime object during timezone conversion');
      return timeString;
    }
    
    // Convert to the target timezone
    const convertedDt = dt.setZone(toTimezone);
    if (!convertedDt.isValid) {
      console.warn('Failed to convert DateTime to target timezone');
      return timeString;
    }
    
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
 * Enhanced with additional error handling to prevent NaN issues
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
  if (!timeString || !isValidTimeString(timeString)) return false;
  if (!timezone || !IANAZone.isValidZone(timezone)) return false;
  if (marginMinutes < 0 || isNaN(marginMinutes)) marginMinutes = 5;
  
  try {
    const timeInfo = parseTimeString(timeString);
    if (!timeInfo) return false;
    
    const { totalMinutes } = timeInfo;
    
    // Get current time in the specified timezone
    const now = getCurrentTimeInTimezone(timezone);
    if (!now.isValid) return false;
    
    const currentTotalMinutes = now.hour * 60 + now.minute;
    
    // Log details for debugging
    console.log(`Checking time: Target=${timeString} (${totalMinutes} mins), Current=${now.toFormat('HH:mm')} (${currentTotalMinutes} mins), Margin=${marginMinutes} mins`);
    
    // Calculate the difference in minutes
    const diffMinutes = Math.abs(totalMinutes - currentTotalMinutes);
    if (isNaN(diffMinutes)) return false;
    
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
    // Hardcoded list of common timezone identifiers as Info.getIANAZones() causes issues
    const allZones = [
      // Africa
      'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers', 'Africa/Asmara',
      'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau', 'Africa/Blantyre',
      'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta',
      'Africa/Conakry', 'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
      'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg',
      'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa',
      'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi',
      'Africa/Lusaka', 'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
      'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena', 'Africa/Niamey',
      'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo', 'Africa/Sao_Tome', 'Africa/Tripoli',
      'Africa/Tunis', 'Africa/Windhoek',
      
      // America
      'America/Adak', 'America/Anchorage', 'America/Anguilla', 'America/Antigua', 'America/Araguaina',
      'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca', 'America/Argentina/Cordoba',
      'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Mendoza',
      'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
      'America/Argentina/San_Luis', 'America/Argentina/Tucuman', 'America/Argentina/Ushuaia',
      'America/Aruba', 'America/Asuncion', 'America/Atikokan', 'America/Bahia', 'America/Bahia_Banderas',
      'America/Barbados', 'America/Belem', 'America/Belize', 'America/Blanc-Sablon', 'America/Boa_Vista',
      'America/Bogota', 'America/Boise', 'America/Cambridge_Bay', 'America/Campo_Grande', 'America/Cancun',
      'America/Caracas', 'America/Cayenne', 'America/Cayman', 'America/Chicago', 'America/Chihuahua',
      'America/Costa_Rica', 'America/Creston', 'America/Cuiaba', 'America/Curacao', 'America/Danmarkshavn',
      'America/Dawson', 'America/Dawson_Creek', 'America/Denver', 'America/Detroit', 'America/Dominica',
      'America/Edmonton', 'America/Eirunepe', 'America/El_Salvador', 'America/Fort_Nelson', 'America/Fortaleza',
      'America/Glace_Bay', 'America/Goose_Bay', 'America/Grand_Turk', 'America/Grenada', 'America/Guadeloupe',
      'America/Guatemala', 'America/Guayaquil', 'America/Guyana', 'America/Halifax', 'America/Havana',
      'America/Hermosillo', 'America/Indiana/Indianapolis', 'America/Indiana/Knox', 'America/Indiana/Marengo',
      'America/Indiana/Petersburg', 'America/Indiana/Tell_City', 'America/Indiana/Vevay', 'America/Indiana/Vincennes',
      'America/Indiana/Winamac', 'America/Inuvik', 'America/Iqaluit', 'America/Jamaica', 'America/Juneau',
      'America/Kentucky/Louisville', 'America/Kentucky/Monticello', 'America/Kralendijk', 'America/La_Paz',
      'America/Lima', 'America/Los_Angeles', 'America/Lower_Princes', 'America/Maceio', 'America/Managua',
      'America/Manaus', 'America/Marigot', 'America/Martinique', 'America/Matamoros', 'America/Mazatlan',
      'America/Menominee', 'America/Merida', 'America/Metlakatla', 'America/Mexico_City', 'America/Miquelon',
      'America/Moncton', 'America/Monterrey', 'America/Montevideo', 'America/Montserrat', 'America/Nassau',
      'America/New_York', 'America/Nipigon', 'America/Nome', 'America/Noronha', 'America/North_Dakota/Beulah',
      'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/Nuuk', 'America/Ojinaga',
      'America/Panama', 'America/Pangnirtung', 'America/Paramaribo', 'America/Phoenix', 'America/Port-au-Prince',
      'America/Port_of_Spain', 'America/Porto_Velho', 'America/Puerto_Rico', 'America/Punta_Arenas',
      'America/Rainy_River', 'America/Rankin_Inlet', 'America/Recife', 'America/Regina', 'America/Resolute',
      'America/Rio_Branco', 'America/Santarem', 'America/Santiago', 'America/Santo_Domingo', 'America/Sao_Paulo',
      'America/Scoresbysund', 'America/Sitka', 'America/St_Barthelemy', 'America/St_Johns', 'America/St_Kitts',
      'America/St_Lucia', 'America/St_Thomas', 'America/St_Vincent', 'America/Swift_Current', 'America/Tegucigalpa',
      'America/Thule', 'America/Thunder_Bay', 'America/Tijuana', 'America/Toronto', 'America/Tortola',
      'America/Vancouver', 'America/Whitehorse', 'America/Winnipeg', 'America/Yakutat', 'America/Yellowknife',
      
      // Europe
      'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Astrakhan', 'Europe/Athens', 'Europe/Belgrade',
      'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest',
      'Europe/Busingen', 'Europe/Chisinau', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar',
      'Europe/Guernsey', 'Europe/Helsinki', 'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Jersey',
      'Europe/Kaliningrad', 'Europe/Kiev', 'Europe/Kirov', 'Europe/Lisbon', 'Europe/Ljubljana',
      'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta', 'Europe/Mariehamn',
      'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris',
      'Europe/Podgorica', 'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Samara',
      'Europe/San_Marino', 'Europe/Sarajevo', 'Europe/Saratov', 'Europe/Simferopol', 'Europe/Skopje',
      'Europe/Sofia', 'Europe/Stockholm', 'Europe/Tallinn', 'Europe/Tirane', 'Europe/Ulyanovsk',
      'Europe/Uzhgorod', 'Europe/Vaduz', 'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius',
      'Europe/Volgograd', 'Europe/Warsaw', 'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich',
      
      // Asia
      'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau',
      'Asia/Aqtobe', 'Asia/Ashgabat', 'Asia/Atyrau', 'Asia/Baghdad', 'Asia/Bahrain',
      'Asia/Baku', 'Asia/Bangkok', 'Asia/Barnaul', 'Asia/Beirut', 'Asia/Bishkek',
      'Asia/Brunei', 'Asia/Chita', 'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus',
      'Asia/Dhaka', 'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Famagusta',
      'Asia/Gaza', 'Asia/Hebron', 'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 'Asia/Hovd',
      'Asia/Irkutsk', 'Asia/Jakarta', 'Asia/Jayapura', 'Asia/Jerusalem', 'Asia/Kabul',
      'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kathmandu', 'Asia/Khandyga', 'Asia/Kolkata',
      'Asia/Krasnoyarsk', 'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait', 'Asia/Macau',
      'Asia/Magadan', 'Asia/Makassar', 'Asia/Manila', 'Asia/Muscat', 'Asia/Nicosia',
      'Asia/Novokuznetsk', 'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Phnom_Penh',
      'Asia/Pontianak', 'Asia/Pyongyang', 'Asia/Qatar', 'Asia/Qostanay', 'Asia/Qyzylorda',
      'Asia/Riyadh', 'Asia/Sakhalin', 'Asia/Samarkand', 'Asia/Seoul', 'Asia/Shanghai',
      'Asia/Singapore', 'Asia/Srednekolymsk', 'Asia/Taipei', 'Asia/Tashkent', 'Asia/Tbilisi',
      'Asia/Tehran', 'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk', 'Asia/Ulaanbaatar',
      'Asia/Urumqi', 'Asia/Ust-Nera', 'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk',
      'Asia/Yangon', 'Asia/Yekaterinburg', 'Asia/Yerevan',
      
      // Australia and Pacific
      'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Currie',
      'Australia/Darwin', 'Australia/Eucla', 'Australia/Hobart', 'Australia/Lindeman',
      'Australia/Lord_Howe', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
      'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham',
      'Pacific/Chuuk', 'Pacific/Easter', 'Pacific/Efate', 'Pacific/Enderbury',
      'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti', 'Pacific/Galapagos',
      'Pacific/Gambier', 'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu',
      'Pacific/Kiritimati', 'Pacific/Kosrae', 'Pacific/Kwajalein', 'Pacific/Majuro',
      'Pacific/Marquesas', 'Pacific/Midway', 'Pacific/Nauru', 'Pacific/Niue',
      'Pacific/Norfolk', 'Pacific/Noumea', 'Pacific/Pago_Pago', 'Pacific/Palau',
      'Pacific/Pitcairn', 'Pacific/Pohnpei', 'Pacific/Port_Moresby', 'Pacific/Rarotonga',
      'Pacific/Saipan', 'Pacific/Tahiti', 'Pacific/Tarawa', 'Pacific/Tongatapu',
      'Pacific/Wake', 'Pacific/Wallis',
      
      // Other important zones
      'UTC'
    ];
    
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
 * Enhanced with additional error handling to prevent NaN issues
 * 
 * @param date Date to format
 * @param timezone Timezone to use
 * @param format Optional format string (default: 'full')
 * @returns Formatted date string
 */
export function formatDateInTimezone(
  date: Date | null | undefined,
  timezone: string,
  format: 'full' | 'long' | 'medium' | 'short' = 'medium'
): string {
  try {
    // Handle invalid inputs
    if (!date) {
      console.warn('Invalid date provided for formatting');
      return 'Invalid date';
    }
    
    if (!timezone || !IANAZone.isValidZone(timezone)) {
      console.warn(`Invalid timezone: ${timezone}, falling back to local timezone`);
      const dt = DateTime.fromJSDate(date);
      if (!dt.isValid) return 'Invalid date';
      return dt.toLocaleString(
        format === 'full' ? DateTime.DATETIME_FULL :
        format === 'long' ? DateTime.DATETIME_LONG :
        format === 'medium' ? DateTime.DATETIME_MED :
        DateTime.DATETIME_SHORT
      );
    }
    
    const dt = DateTime.fromJSDate(date).setZone(timezone);
    if (!dt.isValid) {
      console.warn('Invalid DateTime created when formatting date');
      return date.toLocaleString();
    }
    
    return dt.toLocaleString(
      format === 'full' ? DateTime.DATETIME_FULL :
      format === 'long' ? DateTime.DATETIME_LONG :
      format === 'medium' ? DateTime.DATETIME_MED :
      DateTime.DATETIME_SHORT
    );
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