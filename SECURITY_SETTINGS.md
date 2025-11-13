# Security Settings Configuration

This document outlines security settings that must be configured through the Supabase Dashboard.

## Password Protection Against Leaked Credentials

### What It Does
Supabase Auth can automatically check user passwords against the HaveIBeenPwned database to prevent the use of compromised passwords. This adds an additional layer of security by rejecting passwords that have been exposed in known data breaches.

### How to Enable

1. **Open Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]

2. **Go to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Select **Policies** or **Settings** tab

3. **Enable Password Protection**
   - Look for the setting: **"Password Protection"** or **"Breach Detection"**
   - Toggle it **ON** to enable checking against HaveIBeenPwned.org
   - This setting is typically under the "Password Requirements" section

4. **Verify Configuration**
   - Try to create a test account with a known compromised password (e.g., "password123")
   - The system should reject it with an error message

### Benefits

✅ **Prevents Weak Passwords**: Automatically rejects passwords that have been compromised in data breaches

✅ **Real-time Protection**: Checks against the HaveIBeenPwned database during signup and password changes

✅ **Zero Configuration**: Once enabled, works automatically for all users

✅ **Privacy Preserving**: Uses k-anonymity to check passwords without exposing them

### Technical Details

- The check is performed during user signup and password reset
- Uses the HaveIBeenPwned API with k-anonymity to preserve privacy
- Only the first 5 characters of the password hash are sent to the API
- The API returns all hashes matching those 5 characters
- The full hash is compared locally to determine if the password is compromised

### Alternative Configuration

If you cannot access the Supabase Dashboard, you can also configure this via the Supabase CLI:

```bash
# Update project configuration
supabase projects update-config \
  --project-id [YOUR_PROJECT_ID] \
  --auth.password-requirements.breach-detection=true
```

### Notes

- This setting cannot be configured via SQL migrations
- It's a project-level setting in Supabase Auth
- Recommended for all production applications
- May add a small latency to signup/password change operations (typically <100ms)

### Current Status

⚠️ **Action Required**: This setting must be manually enabled through the Supabase Dashboard

---

## Other Recommended Security Settings

While enabling password breach detection, consider reviewing these additional auth settings:

### Password Strength Requirements
- **Minimum Length**: 8 characters (recommended: 12+)
- **Require Uppercase**: Yes
- **Require Lowercase**: Yes
- **Require Numbers**: Yes
- **Require Special Characters**: Yes

### Email Configuration
- **Email Confirmation**: Disabled by default (consider enabling for production)
- **Double Opt-in**: Recommended for marketing emails

### Session Management
- **Session Timeout**: Review and set appropriate timeout values
- **JWT Expiry**: Default is typically fine for most applications

### Rate Limiting
- Review default rate limits for:
  - Signup attempts
  - Login attempts
  - Password reset requests
  - Email sending

---

Last Updated: 2025-11-13
