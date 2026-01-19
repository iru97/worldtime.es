/**
 * Format a timezone string for display.
 * Extracts the city name from IANA timezone format (e.g., "America/New_York" -> "New York")
 */
export function formatTimezone(timezone: string): string {
  const parts = timezone.split('/');
  const city = parts[parts.length - 1];
  return city.replace(/_/g, ' ');
}

/**
 * Get current time in a specific timezone
 */
export function getCurrentTime(timezone: string, hour12 = false): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12
  });
}

/**
 * Get the UTC offset for a timezone in hours
 */
export function getTimezoneOffset(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(p => p.type === 'timeZoneName');
  return offsetPart?.value || 'UTC';
}

/**
 * Validate if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
