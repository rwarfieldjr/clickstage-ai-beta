# Send to Go High Level (GHL) Webhook

This Supabase Edge Function sends order data to a Go High Level webhook.

## Setup

1. Set the `GHL_WEBHOOK_URL` environment variable in your Supabase project:
   ```bash
   supabase secrets set GHL_WEBHOOK_URL=https://your-ghl-webhook-url
   ```

2. Deploy the function:
   ```bash
   supabase functions deploy send-to-ghl
   ```

## Usage

Call this function from your frontend after an order is placed and images are uploaded:

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-to-ghl`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      orderId: "order_123",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      propertyAddress: "123 Main St, City, State",
      selectedStyle: "modern-farmhouse",
      selectedBundle: "bundle_10",
      imageUrls: [
        "https://supabase.co/storage/uploads/image1.jpg",
        "https://supabase.co/storage/uploads/image2.jpg"
      ]
    })
  }
);

const result = await response.json();
console.log(result); // { success: true }
```

## Payload Structure

The function sends the following data to the GHL webhook:

```json
{
  "orderId": "string",
  "customerName": "string",
  "customerEmail": "string",
  "propertyAddress": "string",
  "selectedStyle": "string",
  "selectedBundle": "string",
  "imageUrls": ["string", "string", ...]
}
```
