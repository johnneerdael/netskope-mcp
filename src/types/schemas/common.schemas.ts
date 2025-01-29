import * as z from 'zod';

export const releaseTypeSchema = z.enum([
  'Beta',       // Beta release channel
  'Latest',     // Most recent stable release
  'Latest-1',   // Previous stable release
  'Latest-2'    // Two versions behind latest
] as const).describe('Types of publisher releases available for upgrades');

export const timezoneSchema = z.enum([
  // Africa
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  // Americas
  'America/Argentina/Buenos_Aires',
  'America/Caracas',
  'America/Godthab',
  'America/Lima',
  'America/Mazatlan',
  'America/Santiago',
  'America/Tijuana',
  // Asia
  'Asia/Almaty',
  'Asia/Baghdad',
  'Asia/Baku',
  'Asia/Calcutta',
  'Asia/Dhaka',
  'Asia/Harbin',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kabul',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Krasnoyarsk',
  'Asia/Kuala_Lumpur',
  'Asia/Muscat',
  'Asia/Rangoon',
  'Asia/Taipei',
  'Asia/Tehran',
  'Asia/Vladivostok',
  'Asia/Yakutsk',
  'Asia/Yerevan',
  // Atlantic
  'Atlantic/Azores',
  'Atlantic/Cape_Verde',
  // Australia
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Darwin',
  'Australia/Hobart',
  'Australia/Perth',
  'Australia/Sydney',
  // Brazil
  'Brazil/East',
  // Canada
  'Canada/Atlantic',
  'Canada/Central',
  'Canada/Newfoundland',
  'Canada/Saskatchewan',
  // Europe
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Copenhagen',
  'Europe/Helsinki',
  'Europe/London',
  'Europe/Minsk',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Sarajevo',
  // Japan
  'Japan',
  // Mexico
  'Mexico/General',
  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guadalcanal',
  'Pacific/Guam',
  'Pacific/Samoa',
  'Pacific/Tongatapu',
  // United States
  'US/Alaska',
  'US/Arizona',
  'US/East-Indiana',
  'US/Eastern',
  'US/Hawaii',
  'US/Mountain',
  'US/Pacific'
] as const).describe('Available timezones for scheduling upgrades');

// Type Exports
export type ReleaseType = z.infer<typeof releaseTypeSchema>;
export type Timezone = z.infer<typeof timezoneSchema>;
