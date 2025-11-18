# Integration Summary - GHL Webhook & File Upload

## Overview
This document summarizes the new Supabase Edge Functions created to handle file uploads and Go High Level (GHL) webhook integration.

## What Was Created

### 1. Upload Images Function
**Location:** `supabase/functions/upload-images/index.ts`

**Purpose:** Handles file uploads to Supabase storage from the frontend.

**Endpoint:** `${SUPABASE_URL}/functions/v1/upload-images`

**Method:** POST (FormData)

**Request Format:**
```typescript
const formData = new FormData();
formData.append("orderId", orderId);
formData.append("fileCount", files.length.toString());
files.forEach((file, index) => {
  formData.append(`file_${index}`, file);
});
```

**Response:**
```json
{
  "urls": ["https://...publicUrl1", "https://...publicUrl2"]
}
```

**Usage:** Already integrated in `/src/pages/place-order/Upload.tsx` at line 150.

---

### 2. Send to GHL Function
**Location:** `supabase/functions/send-to-ghl/index.ts`

**Purpose:** Forwards order data to Go High Level webhook.

**Endpoint:** `${SUPABASE_URL}/functions/v1/send-to-ghl`

**Method:** POST (JSON)

**Required Environment Variable:**
- `GHL_WEBHOOK_URL` - Your Go High Level webhook URL

**Request Format:**
```json
{
  "orderId": "string",
  "customerName": "string",
  "customerEmail": "string",
  "propertyAddress": "string",
  "selectedStyle": "string",
  "selectedBundle": "string",
  "imageUrls": ["url1", "url2", ...]
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 3. Stripe Webhook Integration
**Location:** `supabase/functions/stripe-webhook/index.ts` (updated)

**What Changed:**
- Added automatic forwarding to GHL webhook when `checkout.session.completed` event is received
- Extracts order metadata from Stripe session
- Calls the `send-to-ghl` function with the order data

**Metadata Required in Stripe Checkout Session:**
```typescript
metadata: {
  orderId: string,
  customerName: string,
  customerEmail: string,
  propertyAddress: string,
  selectedStyle: string,
  selectedBundle: string,
  imageUrlsJson: JSON.stringify(imageUrls) // Array of image URLs
}
```

---

## Deployment Instructions

### 1. Set Environment Variables
```bash
# Set the GHL webhook URL
supabase secrets set GHL_WEBHOOK_URL=https://your-ghl-webhook-url.com

# Verify other required secrets exist
supabase secrets list
```

### 2. Deploy Functions
```bash
# Deploy the upload-images function
supabase functions deploy upload-images

# Deploy the send-to-ghl function
supabase functions deploy send-to-ghl

# Re-deploy the updated stripe-webhook function
supabase functions deploy stripe-webhook
```

### 3. Test the Integration
```bash
# Test upload-images
curl -X POST \
  ${SUPABASE_URL}/functions/v1/upload-images \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -F "orderId=test_123" \
  -F "fileCount=1" \
  -F "file_0=@/path/to/test-image.jpg"

# Test send-to-ghl
curl -X POST \
  ${SUPABASE_URL}/functions/v1/send-to-ghl \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_123",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "propertyAddress": "123 Test St",
    "selectedStyle": "modern-farmhouse",
    "selectedBundle": "bundle_10",
    "imageUrls": ["https://example.com/image1.jpg"]
  }'
```

---

## Integration Flow

### Complete Order Flow:
1. **User uploads images** → `upload-images` function stores files in Supabase storage
2. **User completes Stripe checkout** → Order metadata stored in Stripe session
3. **Stripe webhook fires** → `stripe-webhook` function receives event
4. **Webhook processes payment** → Extracts metadata from session
5. **Data forwarded to GHL** → `send-to-ghl` function posts to GHL webhook

### Data Flow Diagram:
```
Frontend Upload
    ↓
upload-images function
    ↓
Supabase Storage (files stored)
    ↓
Stripe Checkout (with metadata)
    ↓
stripe-webhook function (on payment success)
    ↓
send-to-ghl function
    ↓
Go High Level Webhook
```

---

## Frontend Changes

### Updated Files:
- `/src/pages/place-order/Upload.tsx` - Now uses `upload-images` edge function instead of direct Supabase storage upload

### Key Change:
```typescript
// Old: Direct Supabase upload
await supabase.storage.from('uploads').upload(filePath, file);

// New: Via edge function
const response = await fetch(`${supabaseUrl}/functions/v1/upload-images`, {
  method: "POST",
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: formData,
});
```

---

## Notes

- All functions use proper CORS headers for cross-origin requests
- Error handling included with console logging for debugging
- Stripe webhook automatically forwards data to GHL without additional frontend code
- The `imageUrlsJson` metadata field must be a JSON string (use `JSON.stringify()`)

---

## Troubleshooting

### Function not found error:
- Ensure functions are deployed: `supabase functions list`
- Check function logs: `supabase functions logs <function-name>`

### GHL webhook not receiving data:
- Verify `GHL_WEBHOOK_URL` is set: `supabase secrets list`
- Check stripe-webhook logs for errors
- Ensure Stripe metadata includes all required fields

### Upload failures:
- Check file size limits (20MB default)
- Verify Supabase storage bucket "uploads" exists
- Check storage bucket permissions
