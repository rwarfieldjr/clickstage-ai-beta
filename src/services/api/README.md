## API Service Layer Documentation

Complete API service layer for ClickStagePro application.

---

## Architecture

This application uses a **client-side API service layer** that connects to:
1. **Supabase** (database, auth, storage)
2. **Supabase Edge Functions** (server-side logic)
3. **Stripe** (payments via Edge Functions)

**Note**: This is NOT a traditional REST API server. It's a React SPA with centralized service modules.

---

## Services

### 1. Authentication Service (`auth.ts`)

#### `login(credentials)`
Logs in a user with email and password.

```typescript
import { login } from '@/services/api';

const result = await login({
  email: 'user@example.com',
  password: 'password123',
});

if (result.success) {
  console.log('User:', result.user);
  console.log('Is Admin:', result.isAdmin);
} else {
  console.error('Error:', result.error);
}
```

#### `logout()`
Logs out the current user.

```typescript
import { logout } from '@/services/api';

const result = await logout();
```

#### `getSession()`
Gets current session information including admin status.

```typescript
import { getSession } from '@/services/api';

const session = await getSession();
if (session) {
  console.log('User ID:', session.user.id);
  console.log('Is Admin:', session.isAdmin);
}
```

#### `verifyAdmin()`
Checks if current user is an admin.

```typescript
import { verifyAdmin } from '@/services/api';

const isAdmin = await verifyAdmin();
```

---

### 2. Credits Service (`credits.ts`)

#### `getCreditBalance()`
Gets current user's credit balance.

```typescript
import { getCreditBalance } from '@/services/api';

const balance = await getCreditBalance();
if (balance) {
  console.log('Credits:', balance.credits);
}
```

#### `addCredits(params)`
Adds credits to a user account (typically after Stripe checkout).

```typescript
import { addCredits } from '@/services/api';

const result = await addCredits({
  userId: 'user-id',
  amount: 10,
  reason: 'Purchased 10 credits',
  stripePaymentId: 'pi_xxx',
});

if (result.success) {
  console.log('New balance:', result.newBalance);
}
```

#### `deductCredits(userId, amount, orderId?)`
Deducts credits from a user account.

```typescript
import { deductCredits } from '@/services/api';

const result = await deductCredits('user-id', 1, 'order-id');
```

#### `getCreditHistory(userId?)`
Gets credit transaction history.

```typescript
import { getCreditHistory } from '@/services/api';

const transactions = await getCreditHistory();
```

---

### 3. Orders Service (`orders.ts`)

#### `createOrder(params)`
Creates a new staging order.

```typescript
import { createOrder } from '@/services/api';

const result = await createOrder({
  userId: 'user-id',
  originalImageUrl: 'https://...',
  stagingStyle: 'Modern',
  stagingNotes: 'Optional notes',
  propertyAddress: '123 Main St',
  creditsUsed: 1,
});

if (result.success) {
  console.log('Order created:', result.order);
}
```

#### `getUserOrders(userId)`
Gets all orders for a user.

```typescript
import { getUserOrders } from '@/services/api';

const orders = await getUserOrders('user-id');
```

#### `getOrder(orderId)`
Gets a single order by ID.

```typescript
import { getOrder } from '@/services/api';

const order = await getOrder('order-id');
```

#### `updateOrderStatus(orderId, status, stagedImageUrl?)`
Updates an order's status.

```typescript
import { updateOrderStatus } from '@/services/api';

await updateOrderStatus('order-id', 'completed', 'https://staged-image-url');
```

---

### 4. Admin Service (`admin.ts`)

**All admin endpoints require admin authentication.**

#### `getAdminOrders(limit?)`
Gets all orders with user information.

```typescript
import { getAdminOrders } from '@/services/api';

const orders = await getAdminOrders(50);
```

#### `getAdminUsers()`
Gets all users with roles and credit balances.

```typescript
import { getAdminUsers } from '@/services/api';

const users = await getAdminUsers();
```

#### `getAdminUserDetail(userId)`
Gets detailed information for a single user.

```typescript
import { getAdminUserDetail } from '@/services/api';

const userDetail = await getAdminUserDetail('user-id');
// Returns: profile, orders, transactions
```

#### `getAdminStats()`
Gets dashboard statistics.

```typescript
import { getAdminStats } from '@/services/api';

const stats = await getAdminStats();
// Returns: totalUsers, totalOrders, pendingOrders, completedOrders, creditsSold, creditsUsed
```

#### `sendTestEmail(to, testType?)`
Sends a test email (admin only).

```typescript
import { sendTestEmail } from '@/services/api';

const result = await sendTestEmail('test@example.com', 'order_confirmation');
```

#### `updateUserCredits(userId, amount, reason)`
Updates user credits (admin action).

```typescript
import { updateUserCredits } from '@/services/api';

const result = await updateUserCredits('user-id', 10, 'Admin adjustment');
```

---

### 5. Stripe Service (`stripe.ts`)

#### `createCheckoutSession(params)`
Creates a Stripe Checkout session.

```typescript
import { createCheckoutSession } from '@/services/api';

const result = await createCheckoutSession({
  priceId: 'price_xxx',
  quantity: 1,
  successUrl: window.location.origin + '/success',
  cancelUrl: window.location.origin + '/pricing',
  metadata: {
    credits: '10',
  },
});

if (result.url) {
  window.location.href = result.url;
}
```

#### `getStripeCustomer()`
Gets Stripe customer for current user.

```typescript
import { getStripeCustomer } from '@/services/api';

const customer = await getStripeCustomer();
```

#### `getStripeOrders()`
Gets Stripe orders for current user.

```typescript
import { getStripeOrders } from '@/services/api';

const orders = await getStripeOrders();
```

#### `verifyPayment(sessionId)`
Verifies a payment was successful.

```typescript
import { verifyPayment } from '@/services/api';

const result = await verifyPayment('cs_test_xxx');
if (result.verified) {
  console.log('Payment verified!');
}
```

---

### 6. Upload Service (`upload.ts`)

#### `uploadFile(params)`
Uploads a file to Supabase Storage.

```typescript
import { uploadFile } from '@/services/api';

const result = await uploadFile({
  file: fileObject,
  bucket: 'uploads', // optional, defaults to 'uploads'
  folder: 'my-folder', // optional, defaults to userId
});

if (result.success) {
  console.log('File URL:', result.url);
  console.log('File path:', result.path);
}
```

#### `uploadFiles(files, params?)`
Uploads multiple files.

```typescript
import { uploadFiles } from '@/services/api';

const results = await uploadFiles([file1, file2], {
  bucket: 'uploads',
});
```

#### `deleteFile(bucket, path)`
Deletes a file from storage.

```typescript
import { deleteFile } from '@/services/api';

await deleteFile('uploads', 'path/to/file.jpg');
```

#### `getSignedUrl(bucket, path, expiresIn?)`
Gets a signed URL for a private file.

```typescript
import { getSignedUrl } from '@/services/api';

const result = await getSignedUrl('uploads', 'path/to/file.jpg', 3600);
if (result.url) {
  console.log('Signed URL:', result.url);
}
```

#### `listFiles(bucket, folder?)`
Lists files in a bucket.

```typescript
import { listFiles } from '@/services/api';

const files = await listFiles('uploads', 'my-folder');
```

---

## Usage in Components

### Example: Login Component

```tsx
import { useState } from 'react';
import { login } from '@/services/api';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const result = await login({ email, password });

    if (result.success) {
      if (result.isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      alert(result.error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Example: Upload Component

```tsx
import { useState } from 'react';
import { uploadFile, createOrder } from '@/services/api';

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    // Upload file
    const uploadResult = await uploadFile({ file });

    if (uploadResult.success) {
      // Create order
      const orderResult = await createOrder({
        userId: 'current-user-id',
        originalImageUrl: uploadResult.url!,
        stagingStyle: 'Modern',
        creditsUsed: 1,
      });

      if (orderResult.success) {
        alert('Order created successfully!');
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload}>Upload & Order</button>
    </div>
  );
}
```

### Example: Credit Purchase

```tsx
import { createCheckoutSession } from '@/services/api';

export function PricingPage() {
  const handlePurchase = async (priceId: string, credits: number) => {
    const result = await createCheckoutSession({
      priceId,
      quantity: 1,
      successUrl: window.location.origin + '/credits-success',
      cancelUrl: window.location.origin + '/pricing',
      metadata: {
        credits: credits.toString(),
      },
    });

    if (result.url) {
      window.location.href = result.url;
    } else {
      alert(result.error);
    }
  };

  return (
    <button onClick={() => handlePurchase('price_10credits', 10)}>
      Buy 10 Credits - $70
    </button>
  );
}
```

---

## Error Handling

All API services return consistent error responses:

```typescript
interface APIResponse {
  success: boolean;
  error?: string;
  // ... other fields
}
```

Always check the `success` field:

```typescript
const result = await someAPICall();

if (result.success) {
  // Success path
} else {
  // Error path
  console.error(result.error);
  alert(result.error);
}
```

---

## Authentication

Most endpoints automatically use the current Supabase session. No need to pass tokens manually.

Admin endpoints automatically verify admin status and return empty results or errors if unauthorized.

---

## Environment Variables

Required in `.env`:

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

Required in Supabase Edge Functions secrets:

```bash
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
EMAIL_FROM=ClickStagePro <support@clickstagepro.com>
```

---

## Database Tables Used

- `profiles` - User profiles
- `user_roles` - User roles (user/admin)
- `user_credits` - Credit balances
- `credit_transactions` - Credit history
- `orders` - Staging orders
- `payments` - Payment records
- `stripe_customers` - Stripe customer mappings
- `stripe_orders` - Stripe order records
- `audit_log` - System audit log

---

## Edge Functions Used

- `test-email` - Send test emails
- `create-simple-checkout` - Create Stripe checkout
- `verify-payment` - Verify payment status
- `stripe-webhook` - Handle Stripe webhooks

---

## Best Practices

1. **Always check success field** before using data
2. **Handle errors gracefully** with user-friendly messages
3. **Use TypeScript** for type safety
4. **Validate inputs** before calling API
5. **Show loading states** during async operations
6. **Cache results** when appropriate
7. **Use hooks** to manage API state in components

---

## Testing

Test individual API calls in browser console:

```javascript
import { getCreditBalance } from '@/services/api';

const balance = await getCreditBalance();
console.log(balance);
```

Or create a test page at `/test` that calls various APIs.

---

## Migration from Old API

If migrating from old API routes:

| Old Route | New Service |
|-----------|-------------|
| `POST /api/login` | `login(credentials)` |
| `POST /api/logout` | `logout()` |
| `GET /api/admin/session` | `getSession()` |
| `POST /api/orders/create` | `createOrder(params)` |
| `GET /api/credits/balance` | `getCreditBalance()` |
| `POST /api/credits/add` | `addCredits(params)` |
| `POST /api/upload` | `uploadFile(params)` |
| `GET /api/admin/orders` | `getAdminOrders()` |
| `GET /api/admin/users` | `getAdminUsers()` |
| `POST /api/admin/send-test-email` | `sendTestEmail()` |
| `POST /api/stripe/create-checkout-session` | `createCheckoutSession()` |

---

## Support

For questions or issues, check:
1. Browser console for errors
2. Supabase Edge Function logs
3. Database RLS policies
4. Environment variables

---

**API Service Layer Complete! 🎉**

All backend functionality is now accessible via clean, typed TypeScript modules.