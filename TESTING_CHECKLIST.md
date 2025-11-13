# ClickStagePro Testing Checklist

## ✅ Quick Verification Tests

### 1. Turnstile Test (2 minutes)
```
□ Go to /auth
□ Open DevTools Console (F12)
□ Enter email: test@example.com
□ Enter password: test1234567890
□ See Turnstile checkbox appear
□ See console log: [TURNSTILE DEBUG] Token state: { hasToken: false, shouldShowTurnstile: true }
□ Click checkbox manually
□ See console log: [TURNSTILE] ✓ Verification successful (Login)
□ See button enable
□ Try clicking button without Turnstile → Should show error toast
□ Click Turnstile, then submit → Should proceed
```

### 2. Routing Test (1 minute)
```
□ Navigate to /bucket-test
□ Press F5 (refresh page)
□ Page loads without 404 ✓
□ Navigate to /pricing
□ Press F5 (refresh page)
□ Page loads without 404 ✓
□ Navigate to /dashboard
□ Press F5 (refresh page)
□ Redirects to /auth (expected - not logged in) ✓
```

### 3. Favicon Test (30 seconds)
```
□ Load any page
□ Check browser tab icon
□ See ClickStagePro camera icon ✓
□ NOT Lovable icon ✓
```

### 4. Stripe Test (1 minute)
```
□ Go to /pricing
□ See 6 pricing tiers displayed
□ Click any "Purchase" button
□ Stripe Checkout opens (or shows login required)
□ Do NOT see "enter API key" message ✓
```

### 5. Build Test (30 seconds)
```bash
□ Run: npm run build
□ Build completes without errors ✓
□ See: "✓ built in XX.XXs" ✓
□ Check dist/ folder has:
  - index.html ✓
  - _redirects ✓
  - .htaccess ✓
  - favicon.png ✓
  - assets/ folder ✓
```

---

## 🐛 If Issues Persist

### Turnstile Still Flashing:
1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check console for errors
4. Verify VITE_TURNSTILE_SITE_KEY is set in .env

### 404 on Routes:
1. Verify deployment includes _redirects or .htaccess
2. Check hosting platform:
   - Netlify: Needs _redirects
   - Vercel: Needs vercel.json (at project root)
   - Apache: Needs .htaccess
   - Cloudflare: Needs _redirects
3. Ensure dist/ folder was deployed, not src/

### Favicon Wrong:
1. Hard refresh: Ctrl+Shift+R
2. Clear browser cache
3. Check dist/favicon.png exists
4. Verify index.html has: <link rel="icon" href="/favicon.png" />

### Stripe Issues:
1. Check Supabase Dashboard → Edge Functions → Secrets
2. Verify these secrets are set:
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
3. Test Edge Function: supabase/functions/create-checkout
4. Check Stripe Dashboard for webhook logs

---

## 📊 Expected Console Logs

### On Auth Page Load:
```
[TURNSTILE DEBUG] Token state: { hasToken: false, tokenLength: 0, shouldShowTurnstile: false, timestamp: "..." }
```

### After Entering Email + Password:
```
[TURNSTILE DEBUG] Token state: { hasToken: false, tokenLength: 0, shouldShowTurnstile: true, timestamp: "..." }
```

### After Clicking Turnstile:
```
[TURNSTILE] ✓ Verification successful (Login) { tokenLength: 237, tokenPreview: "0.Ab1Cd2Ef3Gh4Ij5K...", timestamp: "..." }
[TURNSTILE DEBUG] Token state: { hasToken: true, tokenLength: 237, shouldShowTurnstile: true, timestamp: "..." }
```

### On Form Submit:
```
[TURNSTILE] Form submit - checking validation { isSignUp: false, shouldShowTurnstile: true, hasTurnstileToken: true, turnstileToken: "0.Ab1Cd2Ef3Gh4Ij5K..." }
[TURNSTILE] Validation passed, proceeding with auth
```

### On Tab Switch:
```
[TURNSTILE] Tab changed, token cleared { activeTab: "signup" }
```

---

## 🎯 Success Criteria

All tests pass = Project is working correctly ✅

If any test fails:
1. Check console for errors
2. Verify hard refresh was done
3. Check deployment includes all dist/ files
4. Review COMPLETE_REPAIR_SUMMARY.md for details
5. Contact support with specific error messages
