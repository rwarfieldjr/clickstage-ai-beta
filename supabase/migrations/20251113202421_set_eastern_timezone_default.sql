/*
  # Update Default Timezone to Eastern Time

  1. Changes
    - Set default timezone for new users to America/New_York (Eastern Time)
    - Update existing NULL timezones to America/New_York

  2. Notes
    - Users can still change their timezone in profile settings
    - Existing custom timezones are preserved
*/

-- Update the default for future users
ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN timezone SET DEFAULT 'America/New_York';

-- Update existing users with NULL or UTC timezone to Eastern
UPDATE public.profiles
SET timezone = 'America/New_York'
WHERE timezone IS NULL OR timezone = 'UTC';
