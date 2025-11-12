# ClickStage Pro 3.0 - Storage Buckets Confirmation

**Date**: November 12, 2025
**Supabase Project**: cbrbrmldlgspsfswakxt
**Status**: ✅ ALL BUCKETS CREATED AND CONFIGURED

---

## Storage Buckets Created

All 7 storage buckets have been successfully created and configured with proper access policies:

### 1. ✅ uploads (Public Read, Authenticated Write)
- **Purpose**: Original listing photo uploads
- **Public Access**: YES - Anyone can read/view
- **Write Access**: Authenticated users only
- **File Size Limit**: 50 MB (52,428,800 bytes)
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp
  - image/heic
- **Policies**:
  - ✓ Public read access for everyone
  - ✓ Authenticated users can upload files
  - ✓ Users can update their own uploads
  - ✓ Users can delete their own uploads

### 2. ✅ staged (Public Read, Authenticated Write)
- **Purpose**: AI-staged final images
- **Public Access**: YES - Anyone can read/view
- **Write Access**: Authenticated users and service role
- **File Size Limit**: 50 MB (52,428,800 bytes)
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp
- **Policies**:
  - ✓ Public read access for everyone
  - ✓ Authenticated users can upload staged files
  - ✓ Users can update their own staged files
  - ✓ Users can delete their own staged files
  - ✓ Service role has full access (for AI processing)

### 3. ✅ previews (Private Only)
- **Purpose**: Temporary generated previews
- **Public Access**: NO - Private bucket
- **Write Access**: Service role only
- **File Size Limit**: 10 MB (10,485,760 bytes)
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp
- **Policies**:
  - ✓ Service role has full access
  - ⚠️ Admin access pending (requires user_roles table)

### 4. ✅ avatars (Public Read, Authenticated Write)
- **Purpose**: Agent or photographer profile photos
- **Public Access**: YES - Anyone can read/view
- **Write Access**: Authenticated users (own files only)
- **File Size Limit**: 5 MB (5,242,880 bytes)
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp
- **Policies**:
  - ✓ Public read access for everyone
  - ✓ Authenticated users can upload avatars (own folder)
  - ✓ Users can update their own avatars
  - ✓ Users can delete their own avatars

### 5. ✅ marketing-assets (Public Read, Authenticated Write*)
- **Purpose**: Site banners, demo images, and promotional assets
- **Public Access**: YES - Anyone can read/view
- **Write Access**: Currently authenticated users, will be restricted to admins
- **File Size Limit**: 10 MB (10,485,760 bytes)
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp
  - image/svg+xml
- **Policies**:
  - ✓ Public read access for everyone
  - ⚠️ Authenticated users can upload (temporarily - should be admin-only)
  - ⚠️ Authenticated users can update (temporarily - should be admin-only)
  - ⚠️ Authenticated users can delete (temporarily - should be admin-only)
  - ✓ Service role has full access

**NOTE**: Admin-only write access will be enforced after creating the user_roles table. Currently allows all authenticated users to maintain functionality.

### 6. ✅ invoices (Private Only)
- **Purpose**: Stripe invoice PDFs and transaction receipts
- **Public Access**: NO - Private bucket
- **Write Access**: Service role only
- **Read Access**: Users can view their own invoices, admins can view all
- **File Size Limit**: 5 MB (5,242,880 bytes)
- **Allowed MIME Types**:
  - application/pdf
- **Policies**:
  - ✓ Service role has full access
  - ✓ Users can view their own invoices
  - ⚠️ Admin access pending (requires user_roles table)

### 7. ✅ logs (Private Only)
- **Purpose**: Diagnostic and event logs
- **Public Access**: NO - Private bucket
- **Write Access**: Service role only
- **File Size Limit**: 10 MB (10,485,760 bytes)
- **Allowed MIME Types**:
  - text/plain
  - application/json
- **Policies**:
  - ✓ Service role has full access
  - ⚠️ Admin read access pending (requires user_roles table)

---

## Access Level Summary

### Public Buckets (Anyone Can Read)
| Bucket | Public Read | Who Can Write | Who Can Update | Who Can Delete |
|--------|-------------|---------------|----------------|----------------|
| uploads | ✅ | Authenticated | Own files only | Own files only |
| staged | ✅ | Authenticated + Service | Own files only | Own files only |
| avatars | ✅ | Authenticated (own folder) | Own files only | Own files only |
| marketing-assets | ✅ | Authenticated* | Authenticated* | Authenticated* |

*Will be restricted to admins once user_roles table is created

### Private Buckets (Service Role/Admin Only)
| Bucket | Public Read | Who Can Write | Who Can Read | Notes |
|--------|-------------|---------------|--------------|-------|
| previews | ❌ | Service only | Service only | Admin access pending |
| invoices | ❌ | Service only | Service + Users (own) + Admins (all) | Users see own invoices |
| logs | ❌ | Service only | Service only | Admin access pending |

---

## Supabase Connection Details

**Project URL**: https://cbrbrmldlgspsfswakxt.supabase.co
**Anon Key**: sb_publishable_xZTqFa26nbla523mzaLP7Q_zKrO7mp2
**Project ID**: cbrbrmldlgspsfswakxt

---

## Security Features

### Row Level Security (RLS)
✅ All storage policies use RLS for fine-grained access control

### File Path Restrictions
✅ Users can only access files in their own user ID folder (where applicable)
✅ Format: `{bucket}/{user_id}/{filename}`

### File Size Limits
✅ Each bucket has appropriate size limits:
- Large images (uploads, staged): 50 MB
- Medium assets (marketing, previews, logs): 10 MB
- Small files (avatars, invoices): 5 MB

### MIME Type Restrictions
✅ Only allowed file types can be uploaded to each bucket:
- Images: JPEG, PNG, WebP, HEIC (uploads only), SVG (marketing only)
- Documents: PDF (invoices only)
- Logs: Plain text, JSON (logs only)

### Role-Based Access
✅ Service role has full access to all buckets for backend operations
⚠️ Admin-specific policies will be added after user_roles table creation

---

## TODO: Admin Access Policies

Once the `user_roles` table is created, update these policies:

1. **marketing-assets**: Restrict write access to admins only
   ```sql
   -- Update policies to check:
   -- EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
   ```

2. **previews**: Add admin read access
   ```sql
   CREATE POLICY "Admins can access previews"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (
       bucket_id = 'previews' AND
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
     );
   ```

3. **invoices**: Add admin read access for all invoices
   ```sql
   CREATE POLICY "Admins can access all invoices"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (
       bucket_id = 'invoices' AND
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
     );
   ```

4. **logs**: Add admin read access
   ```sql
   CREATE POLICY "Admins can access logs"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (
       bucket_id = 'logs' AND
       EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
     );
   ```

---

## Usage Examples

### Frontend Upload to 'uploads' Bucket
```typescript
import { supabase } from '@/integrations/supabase/client';

// Upload file (authenticated user)
const { data, error } = await supabase.storage
  .from('uploads')
  .upload(`${userId}/photo.jpg`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('uploads')
  .getPublicUrl(`${userId}/photo.jpg`);
```

### Backend Upload to 'staged' Bucket (Service Role)
```typescript
// Using service role key in edge function
const { data, error } = await supabaseAdmin.storage
  .from('staged')
  .upload(`${userId}/staged-photo.jpg`, processedFile);
```

### Access Invoice (User sees only their own)
```typescript
const { data, error } = await supabase.storage
  .from('invoices')
  .download(`${userId}/invoice-001.pdf`);
```

### Generate Signed URL (7 days)
```typescript
const { data, error } = await supabase.storage
  .from('invoices')
  .createSignedUrl(`${userId}/invoice-001.pdf`, 604800);
```

---

## Migration File

The storage configuration is stored in:
`supabase/migrations/20251112192817_create_storage_buckets.sql`

This migration:
- ✅ Creates all 7 storage buckets with proper configuration
- ✅ Sets up RLS policies for each bucket
- ✅ Configures file size limits and MIME type restrictions
- ✅ Includes TODO comments for admin-specific policies
- ✅ Updates legacy bucket policies if they exist

---

## Verification Queries

To verify buckets are properly configured:

```sql
-- List all buckets
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;

-- List all storage policies
SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Check file count per bucket
SELECT bucket_id, COUNT(*) as file_count
FROM storage.objects
GROUP BY bucket_id;
```

---

## Status: ✅ COMPLETE

All 7 storage buckets have been created and configured successfully. The storage system is ready for:
- ✅ User photo uploads
- ✅ AI-processed image storage
- ✅ Profile avatar management
- ✅ Marketing asset storage
- ✅ Invoice generation and storage
- ✅ System log storage
- ✅ Temporary preview generation

The only pending items are admin-specific access policies, which can be added after the user_roles table is created from the base schema migrations.

**Project is storage-ready for deployment.**
