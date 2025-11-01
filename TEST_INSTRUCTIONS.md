# How to Test All Checkout Flows

## Quick Test (30 seconds)

### Step 1: Open the App
Navigate to your pricing page:
```
http://localhost:5173/pricing
```

### Step 2: Open Browser Console
- **Windows/Linux**: Press `F12` or `Ctrl + Shift + J`
- **Mac**: Press `Cmd + Option + J`

### Step 3: Run Test Command
Copy and paste this into the console:
```javascript
await window.testAllCheckouts()
```

### Step 4: Review Results
Look for this at the bottom:
```
🎉 ALL TESTS PASSED! Checkout system is fully operational.
```

Or if there are failures:
```
⚠️  2 test(s) failed. Please review errors above and fix before deploying.
```

## What Gets Tested

✅ **All 5 pricing tiers:**
- 1 Photo ($10) - price_1QXYyuJ5VhXXCYm3iGTmCKQh
- 5 Photos ($45) - price_1QXYyxJ5VhXXCYm3qT9BsSC8
- 10 Photos ($85) - price_1QXYz9J5VhXXCYm3Kkt5p5Rt
- 20 Photos ($160) - price_1QXYzMJ5VhXXCYm36y6GXwVD
- 50 Photos ($375) - price_1QXYzXJ5VhXXCYm3uf3IlSKh

✅ **Both checkout endpoints:**
- `create-simple-checkout` (primary)
- `create-checkout` (with fallback)

✅ **Validation checks:**
- Valid checkout URL returned
- URL starts with `https://checkout.stripe.com/`
- Response time <2 seconds
- No console errors

## Understanding Results

### Success Output
```
✅ PASSED TESTS:

  • 1 Photo ($10) - 245ms
  • 5 Photos ($45) - 312ms
  • 10 Photos ($85) - 276ms
  • 20 Photos ($160) - 301ms
  • 50 Photos ($375) - 289ms
  • 1 Photo - Fallback Test - 389ms
```

All tiers created checkout sessions successfully!

### Failure Output
```
❌ FAILED TESTS:

  • 20 Photos ($160)
    Price ID: price_1QXYzMJ5VhXXCYm36y6GXwVD
    Error: Invalid price ID
    Response Time: 154ms
```

This tier has an invalid Price ID in Stripe.

## Test Individual Tiers

If a specific tier fails, test it individually:

```javascript
// Test the failing tier
await window.testSingleTier("price_1QXYzMJ5VhXXCYm36y6GXwVD")
```

## Test Just Connectivity

Quick check if Supabase is reachable:

```javascript
await window.testConnectivity()
```

Expected output:
```
✅ Edge function reachable (expected error for test ID)
```

## View Saved Results

Results are saved for later review:

```javascript
// Get all results
const results = JSON.parse(sessionStorage.getItem('checkoutTestResults'))
console.table(results)

// Get only failures
const failures = results.filter(r => !r.success)
console.log('Failed tests:', failures)

// Check specific tier
const tier20 = results.find(r => r.tier.includes('20 Photos'))
console.log('20 Photo tier:', tier20)
```

## Common Issues & Fixes

### Issue: "testAllCheckouts is not a function"
**Fix**: Refresh the page (F5) and try again

### Issue: All tests fail with "Network error"
**Fix**: 
1. Check your internet connection
2. Verify Supabase is running
3. Check `.env` file has correct API keys

### Issue: One tier fails with "Invalid price ID"
**Fix**:
1. Open Stripe Dashboard
2. Go to Products → View the failing tier
3. Copy the correct Price ID
4. Update `src/config/pricing.ts`

### Issue: Tests timeout after 30 seconds
**Fix**:
1. Check Stripe API status: https://status.stripe.com
2. Check Supabase status: https://status.supabase.com
3. Review edge function logs for errors

## Manual Click Testing

After automated tests pass, manually test the UI:

### On Pricing Page
1. Click each "Buy [Tier]" button
2. Verify toast appears: "Opening checkout..."
3. Verify Stripe checkout page opens
4. Close Stripe page and try next tier

### On Dashboard
1. Login as a user
2. Scroll to "Purchase Credits" section
3. Click "Purchase" on any bundle
4. Verify checkout opens

### On Account Settings
1. Navigate to /account-settings
2. Scroll to "Purchase More Credits"
3. Click "Purchase" on any bundle
4. Verify checkout opens

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Run `await window.testAllCheckouts()`
- [ ] Verify 100% success rate
- [ ] Check avg response time <1s
- [ ] Manually test 2-3 tiers via UI
- [ ] Test on staging environment
- [ ] Verify automated health checks enabled

## Post-Deployment Verification

After deploying:

```javascript
// Run tests on production
await window.testAllCheckouts()

// If all pass, set up monitoring
// (See CHECKOUT_STABILITY_GUIDE.md for cron setup)
```

## Troubleshooting Failed Tests

### Step 1: Identify the Problem
Look at the error message:
- "Invalid price ID" → Price doesn't exist in Stripe
- "No checkout URL returned" → Edge function issue
- "Network request failed" → Connectivity issue
- "Exception" → Code error

### Step 2: Check Stripe Dashboard
1. Login to Stripe Dashboard
2. Navigate to Products
3. Find the failing tier
4. Verify:
   - Price is active
   - Price ID matches config
   - Product is not archived

### Step 3: Check Edge Function Logs
1. Open Lovable Cloud backend
2. Navigate to Edge Functions
3. Select `create-simple-checkout`
4. Review recent logs for errors

### Step 4: Verify Configuration
Check `src/config/pricing.ts`:
```typescript
{
  id: "20-photos",
  name: "20 Photos",
  priceId: "price_1QXYzMJ5VhXXCYm36y6GXwVD", // ← Verify this matches Stripe
  // ...
}
```

### Step 5: Test in Isolation
```javascript
// Test the specific failing price ID
await window.testSingleTier("price_1QXYzMJ5VhXXCYm36y6GXwVD")

// Check if it's a Stripe issue or config issue
await window.testConnectivity()
```

## Need Help?

### View Documentation
- Full testing guide: `CHECKOUT_TESTING_GUIDE.md`
- Stability checks: `CHECKOUT_STABILITY_GUIDE.md`
- Implementation: `SIMPLE_CHECKOUT_IMPLEMENTATION.md`

### Debug Resources
- Edge function logs: Lovable Cloud → Backend → Edge Functions
- Stripe logs: https://dashboard.stripe.com/logs
- Network tab: Browser DevTools → Network
- Console errors: Browser DevTools → Console

### Contact Support
If tests fail and you can't resolve:
1. Copy full console output
2. Note which tiers failed
3. Include error messages
4. Email: support@clickstagepro.com

---

**Quick Commands:**
```javascript
// Test everything
await window.testAllCheckouts()

// Test one tier
await window.testSingleTier("price_ABC123")

// Check connectivity
await window.testConnectivity()

// View results
JSON.parse(sessionStorage.getItem('checkoutTestResults'))
```

**Expected Results:**
- ✅ All 6 tests pass (5 tiers + 1 fallback)
- ⏱️ Average response time: 250-400ms
- 🎉 "ALL TESTS PASSED!" message

**Time Required:**
- Initial test run: ~30 seconds
- Manual UI testing: ~2 minutes
- Total: ~2.5 minutes

**Run Frequency:**
- Before every deployment
- After Stripe configuration changes
- After pricing updates
- Weekly in production
