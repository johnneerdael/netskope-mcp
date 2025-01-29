import { UpgradeProfileCommand } from '../commands/upgrade/upgrade-profile-command.js';

async function main() {
  const upgradeProfileCommand = new UpgradeProfileCommand();

  // Example 1: Create a weekly schedule (every Tuesday at 10:00)
  const weeklyProfile = await upgradeProfileCommand.createWithSchedule(
    'weekly-beta-updates',
    'TUE 10:00',
    {
      timezone: 'US/Pacific',
      release_type: 'Beta'
    }
  );
  console.log('Created weekly profile:', weeklyProfile);

  // Example 2: Create a monthly schedule (first Monday of each month at 23:00)
  const monthlyProfile = await upgradeProfileCommand.createWithSchedule(
    'monthly-beta-updates',
    'MON 23:00',
    {
      timezone: 'US/Eastern',
      release_type: 'Beta'
    }
  );
  console.log('Created monthly profile:', monthlyProfile);

  // Example 3: Update an existing profile's schedule
  const updatedProfile = await upgradeProfileCommand.updateSchedule(
    weeklyProfile.id,
    'WED 15:00'
  );
  console.log('Updated profile schedule:', updatedProfile);

  // Example 4: Update using cron format directly
  const convertedProfile = await upgradeProfileCommand.updateSchedule(
    weeklyProfile.id,
    '0 10 * * MON'
  );
  console.log('Updated with cron format:', convertedProfile);
}

main().catch(console.error);
