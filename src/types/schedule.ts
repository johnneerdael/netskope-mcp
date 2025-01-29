/**
 * Types for schedule configuration
 */

/**
 * Frequency type for upgrade schedules
 */
export type FrequencyType = 'weekly' | 'monthly';

/**
 * Week number for monthly schedules (1-5)
 */
export type WeekNumber = 1 | 2 | 3 | 4 | 5;

/**
 * Days of the week in uppercase format
 */
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

/**
 * Schedule configuration parameters
 */
export interface ScheduleConfig {
  name: string;
  frequencyType: FrequencyType;
  dayOfWeek: DayOfWeek;
  weekNumber?: WeekNumber;
  hour: number;
  minute: number;
}
