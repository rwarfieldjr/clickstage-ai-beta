# Credit System (Stable v1.0)

## Overview
This is the permanent credit management system for ClickStagePro. Credits are the primary token system used to track and manage photo staging orders.

## Core Components

### Database Table: `user_credits`
- Stores credit balances for each user
- Fields: `id`, `email`, `credits`, `updated_at`
- Primary key on email for easy lookups
- RLS policies ensure users can only view/modify their own credits

### Core Functions (`src/lib/credits.ts`)
1. **getCredits(email)** - Retrieves current credit balance
2. **addCredits(email, amount)** - Adds credits to user account (upsert)
3. **deductCredits(email, amount)** - Deducts credits (validates sufficient balance)
4. **hasEnoughCredits(email, required)** - Checks if user has enough credits

## Credit Flow

### Purchase Flow (Stripe → Credits)
1. User purchases photo package via Stripe checkout
2. Stripe sends webhook to `stripe-webhook` edge function
3. Webhook handler calls `addCredits()` with purchased amount
4. Credits are added to `user_credits` table
5. User can now use credits for staging orders

### Usage Flow (Credits → Orders)
1. User uploads photos on Upload page
2. System calls `hasEnoughCredits()` to validate balance
3. If sufficient, `deductCredits()` is called
4. Credits are deducted from `user_credits` table
5. Order is processed

### Sync Flow (Daily Reconciliation)
1. `sync-credits` edge function runs daily (or manually)
2. Fetches recent Stripe checkout sessions
3. Compares Stripe purchases with `user_credits` table
4. Adds missing credits if webhook was missed
5. Logs all sync activity

## Key Rules

### Security
- Users cannot spend more credits than they own
- All credit operations validate balance before deduction
- RLS policies prevent unauthorized access
- Admin-only access for credit adjustments

### Stability
- This system is marked as **stable v1.0**
- Do not auto-modify core credit logic
- All credit operations are atomic
- Failed transactions do not deduct credits

### Integration Points
- **Stripe Webhook** (`supabase/functions/stripe-webhook/index.ts`) - Adds credits after purchase
- **Upload Page** (`src/pages/Upload.tsx`) - Checks and deducts credits
- **Sync Function** (`supabase/functions/sync-credits/index.ts`) - Daily reconciliation
- **Checkout** (`src/lib/checkout.ts`) - Validates credits for credit-based orders

## Maintenance

### Daily Operations
- Sync function checks for missed webhooks
- Reconciles Stripe purchases with credit balances
- Logs all discrepancies

### Manual Operations
- Admin can manually add/adjust credits via Supabase dashboard
- Credit history tracked in `credits_transactions` table (separate system)

### Monitoring
- Check logs for failed deductions
- Monitor sync function results
- Alert on webhook failures

## Version Control
**Version**: stable-credits-1.0  
**Last Updated**: 2025-10-31  
**Status**: Production - Do Not Auto-Modify

Files marked with `@version: stable-credits-1.0` should not be automatically modified without review.
