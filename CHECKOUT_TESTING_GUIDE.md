# Checkout Testing Guide

## Overview
Comprehensive testing utility to verify all Stripe checkout flows work correctly across every pricing tier.

## Quick Start

### 1. Open Browser Console
- Press `F12` (Chrome/Firefox)
- Or right-click → Inspect → Console tab

### 2. Navigate to Pricing Page
```
https://your-domain.com/pricing
```

### 3. Run Test Suite
```javascript
// Test all pricing tiers
await window.testAllCheckouts()

// Test single tier
await window.testSingleTier("price_1234567890")

// Test connectivity only
await window.testConnectivity()
```

## Test Functions

### `testAllCheckouts(dryRun = true)`
Tests all pricing tiers sequentially with detailed reporting.

**Parameters:**
- `dryRun` (boolean) - Default true. No actual Stripe charges occur.

**What it tests:**
- ✅ Each pricing tier creates valid checkout session
- ✅ Returns properly formatted Stripe checkout URL
- ✅ Response time is acceptable (<2s)
- ✅ No console errors appear
- ✅ Fallback function works correctly

**Output:**
```
=============================================================
🧪 CHECKOUT TESTING UTILITY
=============================================================

⚠️  DRY RUN MODE - No actual Stripe charges will occur
💡 Set dryRun=false to test with real Stripe API

📋 Testing 5 pricing tiers...

--- Testing create-simple-checkout ---

[TEST] Testing create-simple-checkout for 1 Photo ($10)...
[TEST] ✅ 1 Photo ($10) passed (245ms) - URL: https://checkout.stripe.com/c/pay/cs_test...
[TEST] Testing create-simple-checkout for 5 Photos ($45)...
[TEST] ✅ 5 Photos ($45) passed (312ms) - URL: https://checkout.stripe.com/c/pay/cs_test...
...

--- Testing create-checkout (with fallback) ---

[TEST] Testing create-checkout for 1 Photo - Fallback Test...
[TEST] ✅ 1 Photo - Fallback Test passed (389ms) - URL: https://checkout.stripe.com/c/pay/cs_test...

=============================================================
📊 TEST SUMMARY
=============================================================

Total Tests: 6
✅ Passed: 6
❌ Failed: 0
Success Rate: 100.0%
⏱️  Avg Response Time: 298ms

✅ PASSED TESTS:

  • 1 Photo ($10) - 245ms
  • 5 Photos ($45) - 312ms
  • 10 Photos ($85) - 276ms
  • 20 Photos ($160) - 301ms
  • 50 Photos ($375) - 289ms
  • 1 Photo - Fallback Test - 389ms

=============================================================

💾 Results saved to sessionStorage['checkoutTestResults']
📝 Retrieve with: JSON.parse(sessionStorage.getItem('checkoutTestResults'))

📤 Full results object:
┌─────────┬────────────────────┬──────────┬───────────────┬───────┐
│ (index) │        Tier        │  Status  │ Response (ms) │ Error │
├─────────┼────────────────────┼──────────┼───────────────┼───────┤
│    0    │  '1 Photo ($10)'   │ '✅ PASS' │      245      │  '-'  │
│    1    │  '5 Photos ($45)'  │ '✅ PASS' │      312      │  '-'  │
│    2    │  '10 Photos ($85)' │ '✅ PASS' │      276      │  '-'  │
│    3    │ '20 Photos ($160)' │ '✅ PASS' │      301      │  '-'  │
│    4    │ '50 Photos ($375)' │ '✅ PASS' │      289      │  '-'  │
│    5    │   'Fallback Test'  │ '✅ PASS' │      389      │  '-'  │
└─────────┴────────────────────┴──────────┴───────────────┴───────┘

🎉 ALL TESTS PASSED! Checkout system is fully operational.
```

### `testSingleTier(priceId)`
Test a specific pricing tier by its Stripe Price ID.

**Parameters:**
- `priceId` (string) - Stripe Price ID (e.g., "price_1234567890")

**Example:**
```javascript
await window.testSingleTier("price_1QXYyuJ5VhXXCYm3iGTmCKQh")
```

**Output:**
```
🧪 Testing single tier: price_1QXYyuJ5VhXXCYm3iGTmCKQh

[TEST] Testing create-simple-checkout for Manual Test...
[TEST] ✅ Manual Test passed (267ms) - URL: https://checkout.stripe.com/c/pay/cs_test...

✅ Test passed!
Checkout URL: https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6...
Response time: 267ms
```

### `testConnectivity()`
Quick test to verify Supabase Edge Functions are reachable.

**Example:**
```javascript
await window.testConnectivity()
```

**Output:**
```
🔌 Testing Supabase connectivity...

✅ Edge function reachable (expected error for test ID)
Response: Invalid price ID: test_connectivity
```

## Test Results Storage

All test results are automatically saved to `sessionStorage` for later review:

```javascript
// Retrieve stored results
const results = JSON.parse(sessionStorage.getItem('checkoutTestResults'))

// View specific tier result
const tier1 = results.find(r => r.tier.includes('1 Photo'))
console.log(tier1)

// Check all failed tests
const failures = results.filter(r => !r.success)
console.log('Failed tests:', failures)

// Calculate stats
const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
console.log(`Average response time: ${avgTime}ms`)
```

## Interpreting Results

### Success Criteria
✅ Each test should:
1. Return `success: true`
2. Have valid `checkoutUrl` starting with `https://checkout.stripe.com/`
3. Complete in <2000ms
4. Show no console errors

### Common Failures

#### "No checkout URL returned"
**Cause**: Edge function succeeded but didn't return URL
**Fix**: Check `create-simple-checkout` function response format

#### "Invalid price ID"
**Cause**: priceId doesn't exist in Stripe
**Fix**: Verify Price ID in Stripe Dashboard → Products

#### "Edge function error"
**Cause**: Supabase function invocation failed
**Fix**: Check edge function logs, verify deployment

#### "Exception: Network request failed"
**Cause**: No internet or Supabase unreachable
**Fix**: Check network connection, verify Supabase status

## Testing in Different Environments

### Development (localhost)
```javascript
// Tests use dev Stripe keys automatically
await window.testAllCheckouts()
```

### Staging
```javascript
// Verify staging Stripe keys work
await window.testAllCheckouts()
```

### Production
```javascript
// CAUTION: Uses live Stripe keys
// Set dryRun=false ONLY if you want to create real sessions
await window.testAllCheckouts(false)
```

## Automated Testing

### Using Browser Console
```javascript
// Run tests on page load (for CI/CD)
(async () => {
  await window.testAllCheckouts()
  
  // Check results
  const results = JSON.parse(sessionStorage.getItem('checkoutTestResults'))
  const allPassed = results.every(r => r.success)
  
  if (!allPassed) {
    throw new Error('Checkout tests failed!')
  }
  
  console.log('✅ All checkout tests passed')
})()
```

### Using Playwright/Cypress
```javascript
// Playwright example
test('checkout system works', async ({ page }) => {
  await page.goto('/pricing')
  
  // Run tests
  const results = await page.evaluate(async () => {
    await window.testAllCheckouts()
    return JSON.parse(sessionStorage.getItem('checkoutTestResults'))
  })
  
  // Verify all passed
  expect(results.every(r => r.success)).toBe(true)
})
```

## Troubleshooting

### Tests Won't Run
**Problem**: `window.testAllCheckouts is not a function`

**Solutions:**
1. Ensure you're on the `/pricing` page
2. Refresh page (F5) to load utilities
3. Check browser console for errors
4. Verify Dev Mode is enabled (utilities only load in development)

### All Tests Fail Immediately
**Problem**: Network or authentication issue

**Steps:**
1. Run `await window.testConnectivity()`
2. Check Supabase status: https://status.supabase.com
3. Verify API keys in `.env` are correct
4. Check browser network tab for blocked requests

### Some Tiers Fail
**Problem**: Specific Price IDs invalid

**Steps:**
1. Copy failed priceId from error
2. Check Stripe Dashboard → Products
3. Verify price is active and not archived
4. Update `src/config/pricing.ts` with correct IDs

### Slow Response Times (>2s)
**Problem**: Edge function or Stripe API slow

**Steps:**
1. Check average response time in summary
2. Review edge function logs for delays
3. Check Stripe API status: https://status.stripe.com
4. Consider adding timeout warnings

## Best Practices

### Before Deploy
✅ Run full test suite
✅ Verify 100% pass rate
✅ Check average response time <1s
✅ Test in staging environment first

### After Deploy
✅ Run tests immediately after going live
✅ Monitor for 24 hours
✅ Set up automated health checks (see `CHECKOUT_STABILITY_GUIDE.md`)

### Regular Testing
✅ Test weekly in production
✅ Test after any Stripe configuration changes
✅ Test after pricing updates
✅ Test after edge function deployments

## Integration with Stability Checks

These manual tests complement the automated stability checks:

**Manual Testing** (this guide)
- Run on-demand in console
- Detailed per-tier results
- Interactive debugging
- Pre-deployment verification

**Automated Checks** (`verify-checkouts` function)
- Runs every 30 minutes
- Logs to database
- Email alerts on failure
- Post-deployment monitoring

Use both for comprehensive checkout reliability!

---

**Quick Reference Commands:**
```javascript
// Test everything
await window.testAllCheckouts()

// Test one tier
await window.testSingleTier("price_ABC123")

// Check connectivity
await window.testConnectivity()

// View last results
JSON.parse(sessionStorage.getItem('checkoutTestResults'))
```

**Need Help?**
- Check edge function logs: [Backend logs]
- Review Stripe dashboard: https://dashboard.stripe.com
- Check system health: Run automated stability check
- Contact support: support@clickstagepro.com
