/**
 * Types and utilities for handling cron expressions
 */

/**
 * Components of a cron expression
 */
export interface CronComponents {
  minute: string;
  hour: string;
  day: string;
  month: string;
  dayOfWeek: string;
}

/**
 * Valid uppercase day names for cron expressions
 */
export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

/**
 * Mapping of numeric days to uppercase names
 */
const DAY_MAP: Record<string, DayOfWeek> = {
  '0': 'SUN',
  '1': 'MON',
  '2': 'TUE',
  '3': 'WED',
  '4': 'THU',
  '5': 'FRI',
  '6': 'SAT'
};

/**
 * Mapping of uppercase names to numeric days
 */
const REVERSE_DAY_MAP: Record<DayOfWeek, string> = {
  'SUN': '0',
  'MON': '1',
  'TUE': '2',
  'WED': '3',
  'THU': '4',
  'FRI': '5',
  'SAT': '6'
};

/**
 * Parse a cron expression into its components
 */
export function parseCron(cron: string): CronComponents {
  const parts = cron.trim().split(' ');
  if (parts.length !== 5) {
    throw new Error('Invalid cron format. Must have exactly 5 parts: minute hour day month dayOfWeek');
  }

  const [minute, hour, day, month, dayOfWeek] = parts;
  return { minute, hour, day, month, dayOfWeek };
}

/**
 * Validate time component (minute/hour)
 */
function validateTimeComponent(value: string, max: number, name: string): void {
  if (value === '*') return;
  
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0 || num > max) {
    throw new Error(`Invalid ${name}. Must be '*' or a number between 0 and ${max}`);
  }
}

/**
 * Normalize day of week to uppercase name format
 */
function normalizeDayOfWeek(day: string): string {
  // If it's already a valid uppercase day name, return it
  if (Object.values(DAY_MAP).includes(day as DayOfWeek)) {
    return day;
  }

  // If it's a numeric day, convert to name
  if (DAY_MAP[day]) {
    return DAY_MAP[day];
  }

  // Try converting to uppercase
  const upperDay = day.toUpperCase();
  if (Object.values(DAY_MAP).includes(upperDay as DayOfWeek)) {
    return upperDay;
  }

  throw new Error('Invalid day of week. Must be 0-6 or SUN-SAT');
}

/**
 * Validate a cron expression format
 */
export function validateCronFormat(cron: string): void {
  const { minute, hour, day, month, dayOfWeek } = parseCron(cron);

  // Validate time components
  validateTimeComponent(minute, 59, 'minute');
  validateTimeComponent(hour, 23, 'hour');

  // Day and month must be *
  if (day !== '*') {
    throw new Error('Day must be *');
  }
  if (month !== '*') {
    throw new Error('Month must be *');
  }

  // Validate day of week format
  try {
    normalizeDayOfWeek(dayOfWeek);
  } catch (error: any) {
    throw new Error(`Invalid day of week: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Build a cron expression from components
 */
export function buildCron(components: CronComponents): string {
  const { minute, hour, day, month, dayOfWeek } = components;
  return `${minute} ${hour} ${day} ${month} ${dayOfWeek}`;
}

/**
 * Normalize a cron expression to use uppercase day names
 */
export function normalizeCronExpression(cron: string): string {
  const components = parseCron(cron);
  
  // Validate time components
  validateTimeComponent(components.minute, 59, 'minute');
  validateTimeComponent(components.hour, 23, 'hour');

  // Ensure day and month are *
  if (components.day !== '*') {
    throw new Error('Day must be *');
  }
  if (components.month !== '*') {
    throw new Error('Month must be *');
  }

  // Normalize day of week
  components.dayOfWeek = normalizeDayOfWeek(components.dayOfWeek);

  return buildCron(components);
}
