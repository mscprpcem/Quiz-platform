/**
 * Indian Standard Time (IST - Asia/Kolkata, UTC+5:30) Universal Date Utilities
 * Ensures consistent, accurate date and time rendering regardless of browser or OS locale/timezone.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format date to human-readable string in IST (e.g., 'Sunday, August 23, 2026')
 */
export function formatToISTDateString(dateVal, options = {}) {
  if (!dateVal) return 'Date Coming Soon';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : 'Date Coming Soon';

  const defaultOptions = {
    timeZone: IST_TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options
  };

  return d.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format date and time to human-readable string in IST (e.g., 'Aug 23, 2026, 12:00 AM')
 */
export function formatToISTDateTimeString(dateVal, includeSeconds = false) {
  if (!dateVal) return 'Date Coming Soon';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : 'Date Coming Soon';

  return d.toLocaleString('en-US', {
    timeZone: IST_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: true
  });
}

/**
 * Format time only in IST (e.g., '12:00 AM' or '03:30 PM')
 */
export function formatToISTTimeString(dateVal) {
  if (!dateVal) return '';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('en-US', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Returns month short name in IST (e.g. 'AUG')
 */
export function getISTMonthShort(dateVal) {
  if (!dateVal) return 'AUG';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return 'AUG';

  return d.toLocaleString('en-US', {
    timeZone: IST_TIMEZONE,
    month: 'short'
  }).toUpperCase();
}

/**
 * Returns day number in IST (e.g. '23')
 */
export function getISTDay(dateVal) {
  if (!dateVal) return '15';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '15';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    day: 'numeric'
  });
  return formatter.format(d);
}

/**
 * Returns YYYY-MM-DD in IST timezone (guarantees correct calendar date without UTC drift)
 */
export function formatToIST_YYYYMMDD(dateVal) {
  if (!dateVal) return '';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: IST_TIMEZONE }).format(d);
  } catch (e) {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
  }
}

/**
 * Convert ISO / Date / datetime string to value for <input type="datetime-local" /> in IST
 */
export function formatToIST_DateTimeLocal(dateVal, defaultTime = '10:00') {
  if (!dateVal) return '';

  if (typeof dateVal === 'string') {
    const str = dateVal.trim();
    // If it's a date-only string like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return `${str}T${defaultTime}`;
    }
    // If it's already in YYYY-MM-DDTHH:mm format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
      return str;
    }
  }

  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(d);
  let year = '', month = '', day = '', hour = '', minute = '';

  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'day') day = part.value;
    if (part.type === 'hour') hour = part.value === '24' ? '00' : part.value;
    if (part.type === 'minute') minute = part.value;
  }

  if (year && month && day) {
    return `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Convert <input type="datetime-local" /> value (e.g. '2026-08-23T00:00') into unambiguous IST ISO String
 */
export function parseDateTimeLocalToISTIso(val) {
  if (!val || String(val).trim() === '') return null;
  const str = String(val).trim();

  // If format is YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss without explicit timezone offset
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
    const d = new Date(`${str}:00`.slice(0, 19) + '+05:30');
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // If format is YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(`${str}T00:00:00+05:30`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
