# Checkout Debugging Guide

## When Live Checkouts Fail

If checkouts work in testing but fail in production, follow this systematic debugging approach.

## Quick Diagnosis

### Step 1: Access Diagnostics Page
Navigate to:
```
https://your-domain.com/diagnostics
```

Or in preview:
```
http://localhost:5173/diagnostics
```

### Step 2: Run All Diagnostics
1. Click "Run All Diagnostics" button
2. Wait for all tests to complete (~5 seconds)
3. Review results for any ❌ failures

### Step 3: Check Browser Console
Open browser console (F12) and look for:
```
[CHECKOUT] logs - Step-by-step checkout flow
[DIAGNOSTICS] logs - Test results
```

## Understanding Console Logs

### Successful Checkout Flow
```
[CHECKOUT] Starting checkout flow
[CHECKOUT] Step 1: Validating priceId
[CHECKOUT] ✅ Price ID format valid
[CHECKOUT] Step 2: Checking Supabase configuration
[CHECKOUT] ✅ Supabase configuration present
[CHECKOUT] Step 3: Invoking create-simple-checkout edge function
[CHECKOUT] Edge function response received (duration: 247ms)
[CHECKOUT] Step 4: Validating response data
[CHECKOUT] Step 5: Validating checkout URL
[CHECKOUT] ✅ Checkout session created successfully
[CHECKOUT] openSimpleCheckout called
[CHECKOUT] ✅ Redirecting to Stripe checkout
```

### Failed Checkout - Example Errors

#### Error: "Missing Supabase configuration"
```
[CHECKOUT] ❌ Missing Supabase configuration
{
  hasUrl: false,
  hasKey: false
}
```

**Cause**: Environment variables not loaded in production  
**Fix**: Verify `.env` is properly configured (Lovable Cloud handles this automatically)

#### Error: "Invalid price ID"
```
[CHECKOUT] ❌ Edge function error
{
  message: "Invalid pricing option",
  status: 400
}
```

**Cause**: Price ID doesn't exist in Stripe  
**Fix**: Update `src/config/pricing.ts` with correct Price IDs from Stripe Dashboard

#### Error: "Payment system configuration error"
```
[CHECKOUT] ❌ Edge function error
{
  message: "Payment system configuration error",
  status: 500
}
```

**Cause**: `STRIPE_SECRET_KEY` not set in Supabase secrets  
**Fix**: Check Lovable Cloud backend → Secrets → Add `STRIPE_SECRET_KEY`

## Common Issues & Solutions

### Issue 1: Works in Preview, Fails in Production

**Symptoms:**
- Checkout works when testing locally
- Fails when deployed to production URL
- Console shows environment variable errors

**Diagnosis:**
```javascript
// In console, run:
console.log({
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...'
});
```

**Solution:**
Environment variables are automatically managed by Lovable Cloud. If you see this issue:
1. Redeploy the application (Publish button)
2. Wait 2-3 minutes for environment to propagate
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### Issue 2: Works Logged In, Fails in Incognito

**Symptoms:**
- Checkout works when logged in
- Fails in incognito/private browsing
- No auth-related errors visible

**Diagnosis:**
Visit `/diagnostics` in incognito mode and run tests

**Solution:**
The `create-simple-checkout` function is public and doesn't require authentication. If it fails in incognito:

1. Check for cookie/localStorage issues
2. Verify CORS headers are set correctly
3. Check if any auth-checking code runs before checkout

### Issue 3: "No checkout URL received"

**Symptoms:**
- Edge function succeeds (no error)
- But response doesn't contain URL
- Console shows `data: { success: false }`

**Diagnosis:**
Check edge function logs:
<lov-actions>
  <lov-open-backend>View Backend Logs</lov-open-backend>
</lov-actions>

**Solution:**
1. Check Stripe API key is valid in secrets
2. Verify Price ID exists and is active in Stripe
3. Check edge function deployed correctly

### Issue 4: Checkout Opens Then Immediately Fails

**Symptoms:**
- Stripe page opens
- Shows "This checkout session has expired"
- Happens immediately

**Diagnosis:**
```
[CHECKOUT] ✅ Redirecting to Stripe checkout
url: https://checkout.stripe.com/c/pay/cs_test_...
```
Then user reports expired session

**Cause**: Stripe test mode vs. production mode mismatch

**Solution:**
Verify environment:
- Preview: Uses test mode (`STRIPE_SECRET_KEY` should start with `sk_test_`)
- Production: Uses live mode (`STRIPE_SECRET_KEY` should start with `sk_live_`)

## Diagnostic Tests Explained

### 1. Environment Variables Test
Checks if all required Supabase configuration is present:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

**Expected Result**: ✅ All present

### 2. Browser Environment Test
Verifies browser capabilities:
- User agent
- Cookies enabled
- Online status

**Expected Result**: ✅ Always passes (informational)

### 3. Current URL Test
Shows where the app is running:
- Origin (domain)
- Full URL
- Protocol (http/https)

**Expected Result**: ✅ Always passes (informational)

### 4. Price IDs Configuration Test
Validates all pricing tiers have correct format:
- All Price IDs start with `price_`
- No empty or missing Price IDs

**Expected Result**: ✅ All valid format

### 5. Checkout Creation Test
Actually creates a real checkout session:
- Calls edge function
- Validates response
- Checks if URL is returned

**Expected Result**: ✅ Successfully created checkout session

**If fails**: This is the root cause - check the error message

## Testing in Different Environments

### Local Development (Preview)
```bash
# Open diagnostics
http://localhost:5173/diagnostics

# Expected behavior:
- Uses test Stripe keys
- Can test without real charges
- Console logs very verbose
```

### Staging/Preview Deployment
```bash
# Open diagnostics
https://your-preview.lovable.app/diagnostics

# Expected behavior:
- Uses test Stripe keys
- Environment variables loaded
- Edge functions deployed
```

### Production
```bash
# Open diagnostics
https://your-domain.com/diagnostics

# Expected behavior:
- Uses live Stripe keys
- Real checkout sessions created
- Reduced console logging
```

## Manual Checkout Test

If diagnostics page isn't accessible, manually test checkout:

1. Open browser console (F12)
2. Navigate to pricing page
3. Click any "Buy" button
4. Watch console output

Look for sequence:
```
[CHECKOUT] Starting checkout flow → 
[CHECKOUT] Step 1... → 
[CHECKOUT] Step 2... → 
[CHECKOUT] Step 3... → 
[CHECKOUT] ✅ Redirecting
```

If it stops at any step, that's where the issue is.

## Reporting Issues

When reporting checkout issues to support, include:

1. **Browser Console Output**
   ```javascript
   // Copy everything starting with [CHECKOUT]
   ```

2. **Diagnostics Results**
   - Go to `/diagnostics`
   - Run tests
   - Click "Copy Results"
   - Include in report

3. **Environment Details**
   - Preview or Production?
   - Logged in or incognito?
   - Which pricing tier?

4. **Exact Error Message**
   - From toast notification
   - From console

## Edge Function Logs

If the issue is in the edge function:

<lov-actions>
  <lov-open-backend>View Backend Logs</lov-open-backend>
</lov-actions>

Look for `create-simple-checkout` function logs:
- Check for errors
- Verify Stripe API calls succeed
- Check if price validation passes

## Quick Fixes Checklist

Try these in order:

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Clear browser cache
- [ ] Try incognito mode
- [ ] Check `/diagnostics` page
- [ ] Review browser console logs
- [ ] Check backend logs
- [ ] Verify Stripe API key in secrets
- [ ] Verify Price IDs match Stripe dashboard
- [ ] Redeploy application
- [ ] Wait 2-3 minutes and try again

## Prevention

To avoid checkout issues:

1. **Always test after deploying:**
   ```bash
   # Visit diagnostics immediately after deploy
   https://your-domain.com/diagnostics
   ```

2. **Monitor automated checks:**
   See `CHECKOUT_STABILITY_GUIDE.md` for setting up automated monitoring

3. **Test in multiple browsers:**
   - Chrome (regular & incognito)
   - Firefox (regular & private)
   - Safari (regular & private)

4. **Verify Stripe dashboard:**
   - All Price IDs are active
   - Webhook endpoints configured
   - API keys valid

## Advanced Debugging

### Enable Verbose Logging

All checkout logs are now production-safe and always fire. No need to enable debug mode.

### Test Specific Price ID

```javascript
// In console
import { createSimpleCheckout } from '@/lib/simpleCheckout';

const result = await createSimpleCheckout('price_1SD8lsIG3TLqP9yabBsx4jyZ');
console.log('Result:', result);
```

### Check Supabase Connection

```javascript
// In console
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('create-simple-checkout', {
  body: { priceId: 'price_test' }
});
console.log({ data, error });
```

## Need Help?

If you've tried everything and it still doesn't work:

1. Copy diagnostics results
2. Copy console logs
3. Note exact error message
4. Email: support@clickstagepro.com

Include:
- Full diagnostics output
- Console logs
- Browser/OS details
- Steps to reproduce

---

**Remember**: The diagnostics page at `/diagnostics` is your first stop for any checkout issue. It will tell you exactly what's wrong in most cases.
