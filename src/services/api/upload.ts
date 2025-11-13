/**
 * Upload API Service
 *
 * Handles file upload operations to Supabase Storage
 */

import { supabase } from '@/integrations/supabase/client';
import { sanitizeFilename } from '@/lib/sanitizeFilename';

export interface UploadParams {
  file: File;
  bucket?: string;
  folder?: string;
  userId?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload file to Supabase Storage
 * POST /api/upload
 */
export async function uploadFile(params: UploadParams): Promise<UploadResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = params.userId || user?.id || 'anonymous';

    // Determine bucket (default to 'uploads')
    const bucket = params.bucket || 'uploads';

    // Sanitize filename
    const fileExt = params.file.name.split('.').pop();
    const sanitizedName = sanitizeFilename(params.file.name.replace(`.${fileExt}`, ''));
    const fileName = `${sanitizedName}_${Date.now()}.${fileExt}`;

    // Build file path
    const folder = params.folder || userId;
    const filePath = `${folder}/${fileName}`;

    console.log(`[UPLOAD] Uploading to ${bucket}/${filePath}`);

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, params.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[UPLOAD] Upload failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('[UPLOAD] Upload successful:', data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error('[UPLOAD] Error in uploadFile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(files: File[], params?: Omit<UploadParams, 'file'>): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadFile({ ...params, file });
    results.push(result);
  }

  return results;
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[UPLOAD] Error in deleteFile:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get signed URL for private file
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return {
        error: error.message,
      };
    }

    return {
      url: data.signedUrl,
    };
  } catch (error: any) {
    console.error('[UPLOAD] Error in getSignedUrl:', error);
    return {
      error: error.message,
    };
  }
}

/**
 * List files in bucket
 */
export async function listFiles(bucket: string, folder?: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('[UPLOAD] Error listing files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[UPLOAD] Error in listFiles:', error);
    return [];
  }
}