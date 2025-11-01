# Simple Checkout Integration Guide

## Overview

The `create-simple-checkout` edge function provides a streamlined way to create Stripe checkout sessions for ClickStagePro pricing bundles without requiring file uploads, contact forms, or session management.

## When to Use Simple Checkout

✅ **Use Simple Checkout For:**
- Pricing page "Buy Now" buttons
- Quick purchase flows without file uploads
- Landing page conversion buttons
- Testing payment integration
- Guest checkout scenarios

❌ **Don't Use Simple Checkout For:**
- Orders that include file uploads
- Orders requiring staging style selection
- Credit-based purchases (use `process-credit-order` instead)
- Complex checkout flows with multi-step forms

---

## Quick Start

### 1. Frontend Integration (Recommended)

```tsx
import { openSimpleCheckout } from '@/lib/simpleCheckout';
import { toast } from 'sonner';

function BuyNowButton({ priceId }: { priceId: string }) {
  const handleClick = async () => {
    try {
      await openSimpleCheckout(priceId);
      // User will be redirected to Stripe Checkout
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Button onClick={handleClick}>
      Buy Now
    </Button>
  );
}
```

### 2. Open in New Tab (Preserve Page State)

```tsx
import { openSimpleCheckoutNewTab } from '@/lib/simpleCheckout';

function BuyNowButton({ priceId }: { priceId: string }) {
  const handleClick = async () => {
    try {
      const checkoutWindow = await openSimpleCheckoutNewTab(priceId);
      if (!checkoutWindow) {
        toast.error("Please allow popups to complete checkout");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Button onClick={handleClick}>
      Buy Now in New Tab
    </Button>
  );
}
```

### 3. Advanced: Manual Control

```tsx
import { createSimpleCheckout } from '@/lib/simpleCheckout';

async function handleCustomCheckout(priceId: string) {
  const result = await createSimpleCheckout(priceId);
  
  if (result.success) {
    console.log("Checkout URL:", result.url);
    console.log("Session ID:", result.sessionId);
    
    // Do custom logic before redirect
    window.location.href = result.url;
  } else {
    console.error("Checkout failed:", result.error);
  }
}
```

---

## Direct API Usage

If you need to call the edge function directly (not recommended - use the client library above):

```typescript
const { data, error } = await supabase.functions.invoke('create-simple-checkout', {
  body: { priceId: 'price_1SD8nJIG3TLqP9yaGAjd2WdP' }
});

if (error) {
  console.error("Error:", error);
} else if (data.success) {
  window.location.href = data.url;
} else {
  console.error("Checkout failed:", data.error);
}
```

---

## API Reference

### Edge Function: `create-simple-checkout`

**Endpoint:** `supabase.functions.invoke('create-simple-checkout')`  
**Auth Required:** No (public endpoint)  
**Rate Limiting:** None (consider adding if abuse occurs)

#### Request Body

```typescript
{
  priceId: string  // Required: Stripe Price ID (must start with 'price_')
}
```

#### Response Format

**Success:**
```typescript
{
  success: true,
  url: string,        // Stripe Checkout URL
  sessionId: string   // Stripe Session ID for tracking
}
```

**Error:**
```typescript
{
  success: false,
  error: string       // Human-readable error message
}
```

#### Error Cases

| Error Message | Cause | HTTP Status |
|--------------|-------|-------------|
| "Missing priceId parameter" | No priceId in request | 400 |
| "Invalid price ID format" | priceId doesn't start with 'price_' | 400 |
| "This pricing option is currently unavailable" | Price is archived in Stripe | 400 |
| "Invalid pricing option" | Price ID doesn't exist | 400 |
| "Payment system configuration error" | Missing Stripe secret key | 500 |
| "Failed to generate checkout URL" | Stripe session created but no URL | 500 |

---

## Valid Price IDs (Production)

Use these verified price IDs from `src/config/pricing.ts`:

| Bundle | Credits | Price | Price ID |
|--------|---------|-------|----------|
| 1 Photo | 1 | $10 | `price_1SD8lsIG3TLqP9yabBsx4jyZ` |
| 5 Photos | 5 | $45 | `price_1SD8nJIG3TLqP9yaGAjd2WdP` |
| 10 Photos | 10 | $85 | `price_1SD8nNIG3TLqP9yazPngAIN0` |
| 20 Photos | 20 | $160 | `price_1SD8nQIG3TLqP9yaBVVV1coG` |
| 50 Photos | 50 | $375 | `price_1SD8nTIG3TLqP9yaT0hRMNFq` |
| 100 Photos | 100 | $700 | `price_1SD8nWIG3TLqP9yaH0D0oIpW` |

**Import from centralized config:**
```typescript
import { PRICING_TIERS } from '@/config/pricing';

const priceId = PRICING_TIERS[0].priceId; // 1 Photo bundle
```

---

## Success & Cancel URLs

After checkout, users are redirected to:

**Success:**
```
/success?session_id={CHECKOUT_SESSION_ID}
```

**Cancel:**
```
/pricing?cancelled=true
```

Make sure these routes exist and handle the appropriate cases:
- Success page should verify payment and show order confirmation
- Pricing page should show a helpful message when `cancelled=true`

---

## Security Considerations

### ✅ What's Protected

1. **Input Validation**: Price ID format validation
2. **Stripe Verification**: Price exists and is active before session creation
3. **Error Sanitization**: No sensitive data exposed in error messages
4. **PII Redaction**: Automatic in production logs
5. **CORS**: Configured for cross-origin requests

### ⚠️ Potential Risks

1. **Public Endpoint**: Anyone can call this function
   - Mitigation: Only creates checkout sessions, doesn't process payments
   - Consider: Add rate limiting if abuse occurs

2. **No User Association**: Sessions aren't tied to user accounts at creation
   - Mitigation: Webhook associates payment with user after completion
   - Consider: Add optional authentication for logged-in users

3. **Price Manipulation**: Users could try invalid price IDs
   - Mitigation: Server validates price exists and is active
   - Stripe prevents amount manipulation

---

## Troubleshooting

### "No checkout URL received"

**Cause**: Edge function returned success but no URL  
**Fix**: Check edge function logs for Stripe API errors

### "Invalid pricing option"

**Cause**: Price ID doesn't exist or is archived in Stripe  
**Fix**: Verify price ID in Stripe dashboard and `src/config/pricing.ts`

### "Payment system configuration error"

**Cause**: Missing `STRIPE_SECRET_KEY` or `STRIPE_SECRET_KEY_BACKEND`  
**Fix**: Add secret via Supabase dashboard → Project Settings → Edge Functions → Secrets

### Popup Blocked (New Tab Method)

**Cause**: Browser blocked `window.open()`  
**Fix**: Call `openSimpleCheckoutNewTab` directly from user click event (not async callback)

---

## Testing

### Development Testing

1. Use Stripe test mode keys
2. Test with Stripe test card: `4242 4242 4242 4242`
3. Check edge function logs in Supabase dashboard

### Production Testing

1. Use a small price ID (1 Photo - $10)
2. Complete actual payment
3. Verify webhook processes correctly
4. Check `processed_stripe_sessions` table for deduplication

---

## Migration from Complex Checkout

If you're currently using the full `create-checkout` flow but don't need file uploads:

**Before:**
```typescript
await handleCheckout({
  files: [],
  selectedBundle: bundle,
  paymentMethod: 'stripe',
  // ... many more fields
});
```

**After:**
```typescript
await openSimpleCheckout(bundle.priceId);
```

---

## Related Documentation

- [Full Checkout Flow](./ARCHITECTURE.md#checkout-flow) - For file upload orders
- [Stripe Webhook](./ARCHITECTURE.md#stripe-webhook) - Payment processing
- [Pricing Configuration](./ARCHITECTURE.md#pricing-system) - Centralized pricing

---

**Last Updated**: 2025-11-01  
**Edge Function**: `supabase/functions/create-simple-checkout/index.ts`  
**Client Library**: `src/lib/simpleCheckout.ts`
