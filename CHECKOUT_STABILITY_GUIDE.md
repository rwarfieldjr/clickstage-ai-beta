# Checkout Stability Check System

## Overview
Automated post-deploy verification system that tests both Stripe checkout endpoints to ensure no regressions after updates or redeploys.

## What It Does

### Automatic Testing
The `verify-checkouts` edge function automatically:
1. Tests `create-simple-checkout` endpoint
2. Tests `create-checkout` endpoint with full payload
3. Verifies each returns 2xx status and valid Stripe checkout URL
4. Measures response time for performance monitoring
5. Logs all results to `checkout_health_log` table

### Failure Detection & Alerts
If either endpoint fails:
- ❌ Logs failure details in database
- 📧 Sends immediate alert email to `support@clickstagepro.com`
- 📊 Includes response times, error messages, and full diagnostic info

## Database Table

### `checkout_health_log`
Stores all stability check results:

```sql
- id (uuid) - Primary key
- timestamp (timestamptz) - When check ran
- endpoint (text) - Which endpoint was tested
- status (text) - Result status
- response_time_ms (integer) - Response time
- success (boolean) - Pass/fail
- error_message (text) - Error details if failed
```

## Setting Up Automated Checks

### Option 1: Cron Job (Recommended)
Run checks every 30 minutes:

```sql
-- Enable pg_cron extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule automated checks every 30 minutes
SELECT cron.schedule(
  'verify-checkouts-every-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ufzhskookhsarjlijywh.supabase.co/functions/v1/verify-checkouts',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
```

### Option 2: Post-Deploy Hook
Add to your CI/CD pipeline after deployment:

```bash
curl -X POST https://ufzhskookhsarjlijywh.supabase.co/functions/v1/verify-checkouts
```

### Option 3: Manual Testing
Run anytime via:

```bash
# Using curl
curl https://ufzhskookhsarjlijywh.supabase.co/functions/v1/verify-checkouts

# Using browser
https://ufzhskookhsarjlijywh.supabase.co/functions/v1/verify-checkouts
```

## Viewing Results

### Query Recent Checks
```sql
SELECT 
  timestamp,
  endpoint,
  success,
  response_time_ms,
  error_message
FROM checkout_health_log
ORDER BY timestamp DESC
LIMIT 20;
```

### Check Failure Rate
```sql
SELECT 
  endpoint,
  COUNT(*) as total_checks,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
  ROUND(AVG(response_time_ms)::numeric, 2) as avg_response_ms
FROM checkout_health_log
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY endpoint;
```

### Recent Failures Only
```sql
SELECT *
FROM checkout_health_log
WHERE NOT success
ORDER BY timestamp DESC
LIMIT 10;
```

## Alert Email Format

When failures occur, you'll receive an email with:
- 🚨 Failed endpoint names
- ⏱️ Response times
- 💥 Error messages
- 📊 Summary of all test results
- 🔗 Site URL and timestamp

## Testing the System

### Test the Function Manually
```bash
curl https://ufzhskookhsarjlijywh.supabase.co/functions/v1/verify-checkouts
```

Expected response:
```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "total_checks": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "endpoint": "create-simple-checkout",
      "status": "success",
      "response_time_ms": 245,
      "success": true,
      "error_message": null
    },
    {
      "endpoint": "create-checkout",
      "status": "success",
      "response_time_ms": 312,
      "success": true,
      "error_message": null
    }
  ],
  "alert_sent": false
}
```

## Maintenance

### Clean Old Logs
Run periodically to prevent table bloat:

```sql
-- Delete logs older than 90 days
DELETE FROM checkout_health_log
WHERE timestamp < NOW() - INTERVAL '90 days';
```

### View Cron Jobs
```sql
SELECT * FROM cron.job;
```

### Remove Cron Job
```sql
SELECT cron.unschedule('verify-checkouts-every-30min');
```

## Benefits

✅ **Immediate Failure Detection** - Know within minutes if checkout breaks  
✅ **Historical Tracking** - See patterns and performance over time  
✅ **Zero Manual Work** - Runs automatically after every deploy  
✅ **Email Alerts** - Get notified immediately when issues arise  
✅ **Performance Monitoring** - Track response times to detect slowdowns  
✅ **Regression Prevention** - Catch breaking changes before customers do  

## Troubleshooting

### No Email Alerts Received
- Verify `RESEND_API_KEY` is set in Supabase secrets
- Check from email is verified in Resend dashboard
- Update `to` email in function if needed

### Function Not Running
- Verify cron extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Check cron job exists: `SELECT * FROM cron.job;`
- Test manual invocation works

### High Failure Rate
- Check Stripe API status: https://status.stripe.com
- Verify Stripe secret keys are valid
- Review recent code changes to checkout flow
- Check error messages in `checkout_health_log` table

## Integration with Monitoring

Export to external monitoring tools:

```sql
-- Export last 24 hours as JSON
SELECT json_agg(
  json_build_object(
    'timestamp', timestamp,
    'endpoint', endpoint,
    'success', success,
    'response_time_ms', response_time_ms
  )
)
FROM checkout_health_log
WHERE timestamp > NOW() - INTERVAL '24 hours';
```

---

**Status**: ✅ Automated stability checks active  
**Frequency**: Every 30 minutes (configurable)  
**Alert Email**: support@clickstagepro.com
