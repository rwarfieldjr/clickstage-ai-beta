/**
 * Storage Utility Functions
 * Handles all Supabase storage operations with proper auth checks and error handling
 */

import { supabase } from "@/integrations/supabase/client";

const BUCKET_UPLOADS = "uploads";
const BUCKET_STAGED = "staged";
const BUCKET_AVATARS = "avatars";

interface StorageError {
  message: string;
  statusCode?: string;
  error?: string;
}

/**
 * Check if user is authenticated before storage operations
 */
async function ensureAuthenticated(): Promise<boolean> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error("[STORAGE] Auth check error:", error);
    return false;
  }

  if (!session) {
    console.warn("[STORAGE] No active session");
    return false;
  }

  return true;
}

/**
 * Test if a bucket exists and is accessible
 */
export async function testBucketAccess(bucketName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      return {
        success: false,
        error: "Not authenticated. Please log in."
      };
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });

    if (error) {
      console.error(`[STORAGE] Bucket test failed for ${bucketName}:`, error);
      return {
        success: false,
        error: error.message || `Bucket '${bucketName}' not found`
      };
    }

    console.log(`[STORAGE] Bucket '${bucketName}' is accessible`);
    return { success: true };
  } catch (err: any) {
    console.error(`[STORAGE] Bucket test exception:`, err);
    return {
      success: false,
      error: err.message || "Unknown storage error"
    };
  }
}

/**
 * Create a signed URL for a file with auth check
 */
export async function createSignedUrl(
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error?: string }> {
  try {
    // Check authentication
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      return {
        url: null,
        error: "Authentication required"
      };
    }

    // Validate inputs
    if (!filePath || filePath.trim() === '') {
      return {
        url: null,
        error: "Invalid file path"
      };
    }

    // Create signed URL
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error(`[STORAGE] Signed URL error for ${bucketName}/${filePath}:`, error);

      // Check if it's a bucket not found error
      if (error.message?.toLowerCase().includes('bucket')) {
        return {
          url: null,
          error: `Storage bucket '${bucketName}' not found. Please check your Supabase configuration.`
        };
      }

      return {
        url: null,
        error: error.message || "Failed to create signed URL"
      };
    }

    return { url: data?.signedUrl || null };
  } catch (err: any) {
    console.error(`[STORAGE] Signed URL exception:`, err);
    return {
      url: null,
      error: err.message || "Storage operation failed"
    };
  }
}

/**
 * Upload a file to storage with auth check
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File | Blob,
  options?: { cacheControl?: string; upsert?: boolean }
): Promise<{ path: string | null; error?: string }> {
  try {
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      return {
        path: null,
        error: "Authentication required"
      };
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false
      });

    if (error) {
      console.error(`[STORAGE] Upload error:`, error);

      if (error.message?.toLowerCase().includes('bucket')) {
        return {
          path: null,
          error: `Storage bucket '${bucketName}' not found`
        };
      }

      return {
        path: null,
        error: error.message || "Upload failed"
      };
    }

    return { path: data?.path || null };
  } catch (err: any) {
    console.error(`[STORAGE] Upload exception:`, err);
    return {
      path: null,
      error: err.message || "Upload failed"
    };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucketName: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      return {
        success: false,
        error: "Authentication required"
      };
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`[STORAGE] Delete error:`, error);
      return {
        success: false,
        error: error.message || "Delete failed"
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error(`[STORAGE] Delete exception:`, err);
    return {
      success: false,
      error: err.message || "Delete failed"
    };
  }
}

/**
 * Test all storage buckets
 */
export async function testAllBuckets(): Promise<{
  uploads: boolean;
  staged: boolean;
  avatars: boolean;
  errors: string[];
}> {
  const results = {
    uploads: false,
    staged: false,
    avatars: false,
    errors: [] as string[]
  };

  const uploadsTest = await testBucketAccess(BUCKET_UPLOADS);
  results.uploads = uploadsTest.success;
  if (!uploadsTest.success) results.errors.push(`Uploads: ${uploadsTest.error}`);

  const stagedTest = await testBucketAccess(BUCKET_STAGED);
  results.staged = stagedTest.success;
  if (!stagedTest.success) results.errors.push(`Staged: ${stagedTest.error}`);

  const avatarsTest = await testBucketAccess(BUCKET_AVATARS);
  results.avatars = avatarsTest.success;
  if (!avatarsTest.success) results.errors.push(`Avatars: ${avatarsTest.error}`);

  return results;
}

// Export bucket names for consistency
export const BUCKETS = {
  UPLOADS: BUCKET_UPLOADS,
  STAGED: BUCKET_STAGED,
  AVATARS: BUCKET_AVATARS
} as const;
