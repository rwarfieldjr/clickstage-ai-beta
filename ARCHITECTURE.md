# ClickStagePro Architecture Documentation

## 🏗️ System Overview

ClickStagePro is a virtual staging platform built on:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (Lovable Cloud) with Edge Functions
- **Payments**: Stripe Checkout (one-time payments)
- **Security**: Cloudflare Turnstile CAPTCHA, RLS policies

---

## 📁 Project Structure

```
src/
├── config/
│   ├── pricing.ts          # Single source of truth for pricing tiers
│   └── environment.ts      # Environment validation & safe logging
├── lib/
│   ├── checkout.ts         # Client-side checkout orchestration
│   ├── credits.ts          # Credit balance operations
│   └── updateUserCreditsAtomic.ts  # Atomic credit transactions
├── pages/
│   ├── Upload.tsx          # File upload & order submission
│   ├── Pricing.tsx         # Pricing page with tier selection
│   ├── Dashboard.tsx       # User dashboard & credit management
│   └── AccountSettings.tsx # User account & credit purchase
└── integrations/
    └── supabase/
        ├── client.ts       # Supabase client (auto-generated)
        └── types.ts        # Database types (auto-generated)

supabase/
├── functions/
│   ├── create-checkout/    # Stripe Checkout session creation
│   ├── verify-payment/     # Payment verification (authenticated)
│   ├── process-credit-order/  # Credit-based order processing
│   ├── stripe-webhook/     # Stripe webhook handler
│   └── _shared/
│       ├── atomic-credits.ts      # Atomic credit operations
│       ├── production-logger.ts   # Production-safe logging
│       ├── verify-turnstile.ts    # CAPTCHA verification
│       └── support-alert.ts       # Error alerting system
└── config.toml             # Edge function configuration
```

---

## 💰 Pricing System

### Centralized Configuration (`src/config/pricing.ts`)

**CRITICAL**: All pricing tiers are defined in ONE PLACE to prevent inconsistencies.

```typescript
export const PRICING_TIERS: readonly PricingTier[] = [
  {
    priceId: "price_1SD8lsIG3TLqP9yabBsx4jyZ",  // Stripe Price ID
    credits: 1,
    price: "$10",
    // ... other fields
  },
  // ... more tiers
];
```

**Usage Across Application:**
- `Upload.tsx`: Uses full tier list for bundle selection
- `Pricing.tsx`: Displays all tiers with marketing copy
- `Dashboard.tsx`: Uses `getDashboardTiers()` (5+ photos only)
- `AccountSettings.tsx`: Same as Dashboard

**Helper Functions:**
- `getPricingTierByPriceId(priceId)`: Validate Stripe Price IDs
- `getPricingTierByCredits(credits)`: Map credits to tier
- `isValidPriceId(priceId)`: Price ID validation
- `getDashboardTiers()`: Get tiers for dashboard (5, 10, 20, 50 photos)

### Stripe Price IDs (Production)

| Credits | Price ID | Checkout URL |
|---------|----------|--------------|
| 1 | `price_1SD8lsIG3TLqP9yabBsx4jyZ` | [Link](https://buy.stripe.com/7sY9AU3eU0tn4DkcHCdZ601) |
| 5 | `price_1SD8nJIG3TLqP9yaGAjd2WdP` | [Link](https://buy.stripe.com/fZu4gA6r68ZT6Ls7nidZ602) |
| 10 | `price_1SD8nNIG3TLqP9yazPngAIN0` | [Link](https://buy.stripe.com/eVqaEYeXC4JDd9Q6jedZ603) |
| 20 | `price_1SD8nQIG3TLqP9yaBVVV1coG` | [Link](https://buy.stripe.com/3cI9AUdTyekd8TA8rmdZ604) |
| 50 | `price_1SD8nTIG3TLqP9yaT0hRMNFq` | [Link](https://buy.stripe.com/aFa14o3eUgsl8TAfTOdZ605) |
| 100 | `price_1SD8nWIG3TLqP9yaH0D0oIpW` | [Link](https://buy.stripe.com/7sYeVe6r64JD4Dk22YdZ606) |

---

## 🔄 Checkout Flow

### Payment Methods
1. **Credit-based**: Authenticated users with sufficient credits
2. **Stripe**: Guest or authenticated users via Stripe Checkout

### Flow Diagram

```
User Uploads Files → Select Bundle → Payment Method Decision
                                            ↓
                        ┌───────────────────┴──────────────────┐
                        ↓                                       ↓
                 Has Credits?                            Stripe Checkout
                 (Authenticated)                         (Guest/Auth)
                        ↓                                       ↓
              process-credit-order                    create-checkout
                        ↓                                       ↓
              Atomic Deduction                        Stripe Session
                        ↓                                       ↓
              Create Orders                           User Pays
                        ↓                                       ↓
              Send Notification                      stripe-webhook
                        ↓                                       ↓
                   SUCCESS ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ Create Orders
```

### Edge Functions

#### 1. `create-checkout` (Public)
**Purpose**: Create Stripe Checkout session for payment

**Flow**:
1. Rate limit check (100 attempts/hour per IP)
2. Validate input (Zod schema)
3. Verify Turnstile CAPTCHA
4. Authenticate user (optional - supports guest checkout)
5. Validate Stripe Price ID exists and is active
6. Create or retrieve Stripe Customer
7. Store checkout data in `abandoned_checkouts`
8. Create Stripe Checkout session
9. Return session URL

**Rate Limiting**: 100 attempts/hour per IP address
**Security**: Turnstile CAPTCHA required, input validation with Zod

#### 2. `process-credit-order` (Authenticated)
**Purpose**: Process orders using user credits

**Flow**:
1. Authenticate user (required)
2. Verify Turnstile CAPTCHA
3. Validate file count matches photos count
4. **Acquire checkout lock** (prevents race conditions)
5. Atomic credit deduction using `update_user_credits_atomic`
6. Create orders for each file
7. Send order notification email
8. **Release checkout lock**

**Critical**: Uses atomic operations to prevent double-spending

#### 3. `stripe-webhook` (Public, Stripe-signed)
**Purpose**: Handle Stripe payment completion

**Flow**:
1. Verify Stripe webhook signature
2. Handle `checkout.session.completed` event
3. Deduplicate using `stripe_event_log` and `processed_stripe_sessions`
4. Extract customer details & session metadata
5. Create or retrieve user account
6. Atomic credit addition using `updateUserCreditsAtomic`
7. Create orders from abandoned checkout data
8. Send order notification
9. Mark abandoned checkout as completed

**Security**: Stripe signature verification prevents spoofing

#### 4. `verify-payment` (Authenticated)
**Purpose**: Verify payment status after Stripe redirect

**Note**: Primarily used for additional verification. Webhook handles the main processing.

---

## 🔒 Security Architecture

### Database Security (Row Level Security)

All tables have RLS policies enforcing user-level access control:

```sql
-- Example: orders table
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Credit System Security

**Atomic Operations** (prevents race conditions):
```typescript
// supabase/functions/_shared/atomic-credits.ts
export async function updateUserCreditsAtomic(
  supabase: SupabaseClient,
  email: string,
  delta: number,
  reason: string,
  orderId?: string,
  stripePaymentId?: string
): Promise<AtomicResult>
```

**Database Function** (server-side enforcement):
```sql
CREATE OR REPLACE FUNCTION update_user_credits_atomic(
  p_user_id UUID,
  p_delta INTEGER,
  p_reason TEXT,
  p_order_id UUID DEFAULT NULL
) RETURNS TABLE(ok BOOLEAN, balance INTEGER, message TEXT)
```

**Checkout Lock** (prevents concurrent checkouts):
- Lock acquired before credit operations
- Lock released in `finally` block (guaranteed cleanup)
- 300-second lock duration
- Returns `429 Checkout In Progress` if locked

### Production Logging

**Safe Logger** (`supabase/functions/_shared/production-logger.ts`):
- Automatically redacts PII (emails, IPs, phone numbers, tokens)
- Environment-aware (verbose in dev, minimal in prod)
- Consistent log format across all edge functions

**Example**:
```typescript
const logger = getLogger("function-name");
logger.info("User authenticated", { email: "user@example.com" });
// Logs: [function-name] INFO: User authenticated { email: "u***@***.com" }
```

### Input Validation

All edge functions use **Zod schemas**:
```typescript
const CreateCheckoutSchema = z.object({
  priceId: z.string().startsWith('price_').max(100),
  contactInfo: z.object({
    email: z.string().email().max(255),
    firstName: z.string().max(100),
    lastName: z.string().max(100),
    phoneNumber: z.string().max(50).optional(),
  }),
  files: z.array(z.string().max(500)).max(100).optional(),
  photosCount: z.number().int().positive().max(1000),
  turnstileToken: z.string().min(1),
});
```

### CAPTCHA Protection

**Cloudflare Turnstile** on all public endpoints:
- `create-checkout`: Required
- `process-credit-order`: Required
- Prevents bot abuse and spam

---

## 🌐 Environment Variables

### Required Variables (Validated on Startup)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ufzhskookhsarjlijywh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=ufzhskookhsarjlijywh

# CAPTCHA
VITE_RECAPTCHA_SITE_KEY=6LdbwO0rAAAAALe58nWs8Oj7VttgBCWVvaCfiRmd
```

### Edge Function Secrets (Server-side Only)

Managed through Supabase Secrets:
- `STRIPE_SECRET_KEY`: Stripe API key (sk_live_...)
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret
- `RESEND_API_KEY`: Email service API key
- `CLOUDFLARE_TURNSTILE_SECRET`: CAPTCHA verification secret
- `SUPABASE_SERVICE_ROLE_KEY`: Database admin access
- `SUPABASE_URL`: Backend URL
- `SUPABASE_ANON_KEY`: Public database access

**Validation**:
```typescript
// src/config/environment.ts
export const ENV = getEnvironmentConfig();
// Throws error if any required variable is missing
```

---

## 🛠️ Error Handling & Self-Healing

### Retry Mechanism

**Client-side** (`src/lib/checkout.ts`):
```typescript
async function retryEdgeFunction(
  operation: () => Promise<any>,
  maxRetries = 3
): Promise<any> {
  // Exponential backoff for 5xx errors
  // Immediate fail for 4xx errors
}
```

### Support Alerting

**Automatic alerts** (`supabase/functions/_shared/support-alert.ts`):
- Critical errors (5xx) trigger immediate email alerts
- 5-minute throttle to prevent spam
- Logs all errors to `error_events` table

### Graceful Degradation

1. **Payment failure**: User gets clear error message with retry option
2. **Email failure**: Order still created, email logged as failed
3. **Credit lock timeout**: User gets clear "try again" message
4. **Rate limit exceeded**: Shows remaining wait time

---

## 📊 Database Schema

### Key Tables

#### `user_credits`
- `user_id` (UUID, PK) - References auth.users
- `credits` (INTEGER) - Current balance
- `locked_until` (TIMESTAMP) - Checkout lock expiration
- `updated_at` (TIMESTAMP)

#### `credit_ledger` (Immutable Audit Trail)
- `id` (UUID, PK)
- `user_id` (UUID) - User who owns the transaction
- `order_id` (UUID) - Associated order
- `delta` (INTEGER) - Credit change (+/-)
- `balance_after` (INTEGER) - Balance after transaction
- `reason` (TEXT) - Human-readable reason
- `created_at` (TIMESTAMP)

#### `orders`
- `id` (UUID, PK)
- `user_id` (UUID) - Order owner
- `order_number` (TEXT) - Human-readable ID (ORD-000001)
- `original_image_url` (TEXT) - Uploaded file path
- `staged_image_url` (TEXT) - Processed result
- `staging_style` (TEXT) - Selected style
- `status` (TEXT) - pending, processing, completed, failed
- `credits_used` (INTEGER) - Credits consumed
- `created_at`, `processing_started`, `completed_at` (TIMESTAMPS)

#### `abandoned_checkouts`
- `session_id` (UUID, PK) - Unique checkout session
- `email`, `first_name`, `last_name`, `phone_number` (TEXT)
- `files` (TEXT[]) - Array of uploaded file paths
- `staging_style` (TEXT)
- `photos_count` (INTEGER)
- `completed` (BOOLEAN) - True after webhook processes
- `created_at` (TIMESTAMP)

#### `processed_stripe_sessions`
- `session_id` (TEXT, PK) - Stripe Checkout Session ID
- `processed_at` (TIMESTAMP) - Deduplication timestamp

#### `checkout_rate_limits`
- `ip_address` (TEXT, PK) - Client IP
- `attempt_count` (INTEGER) - Attempts in current window
- `window_start` (TIMESTAMP) - Rate limit window start

---

## 🚀 Deployment & Maintenance

### Deployment Process

1. **Frontend**: Automatic via Lovable on git push
2. **Edge Functions**: Auto-deploy on push to `supabase/functions/`
3. **Database Migrations**: Manual via Supabase dashboard or CLI

### Monitoring

**Logs Available**:
- Edge function logs: Supabase dashboard → Functions → Logs
- Database queries: Supabase dashboard → Database → Query logs
- Error tracking: `error_events` table
- Credit transactions: `credit_ledger` table

**Key Metrics to Monitor**:
- Rate limit hits per hour
- Failed payment attempts
- Credit deduction errors
- Email delivery failures
- Average checkout completion time

### Troubleshooting

**"Invalid pricing option"**:
- Verify `PRICING_TIERS` in `src/config/pricing.ts`
- Check Stripe dashboard for price status (active/archived)
- Ensure Price ID matches exactly (case-sensitive)

**"No checkout URL received"**:
- Check browser console for detailed error
- Verify rate limits haven't been exceeded
- Ensure Turnstile token is valid
- Check edge function logs for backend errors

**"Insufficient credits"**:
- Verify `user_credits` table balance
- Check `credit_ledger` for transaction history
- Ensure no checkout lock is preventing operations

**"Checkout already in progress"**:
- Wait 5 minutes for lock to expire
- Check `user_credits.locked_until` column
- Manually release lock if needed (admin only)

---

## 🔄 Future Improvements

### Planned Enhancements
1. **File validation**: Server-side image format verification
2. **Virus scanning**: Integration with ClamAV or similar
3. **Payment method**: Add support for recurring subscriptions
4. **Credit expiration**: Automated cleanup of expired credits
5. **Admin panel**: Enhanced order management dashboard

### Scalability Considerations
- **Database**: Supabase autoscaling handles growth
- **Edge Functions**: Serverless, auto-scales with traffic
- **File Storage**: Supabase Storage with CDN distribution
- **Rate Limiting**: Currently IP-based, consider user-based for better UX

---

## 📝 Version History

- **v1.0** (2025-11-01): Initial stable release
  - Centralized pricing configuration
  - Production-safe logging
  - Atomic credit operations
  - Comprehensive error handling
  - Self-healing retry mechanisms

---

## 🔗 External Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [React Query](https://tanstack.com/query/latest)

---

**Last Updated**: 2025-11-01  
**Maintained By**: ClickStagePro Engineering Team  
**Status**: ✅ Production-Ready
