/**
 * Upload API Service
 *
 * Handles file upload operations to Supabase Storage
 */

import { supabase } from '@/integrations/supabase/client';
import { sanitizeFilename } from '@/lib/sanitizeFilename';
import { safeApiCall, ApiResult } from './index';

export interface UploadParams {
  file: File;
  bucket?: string;
  folder?: string;
  userId?: string;
}

export interface UploadData {
  url: string;
  path: string;
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(params: UploadParams): Promise<ApiResult<UploadData>> {
  return safeApiCall(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = params.userId || user?.id || 'anonymous';

    const bucket = params.bucket || 'uploads';

    const fileExt = params.file.name.split('.').pop();
    const sanitizedName = sanitizeFilename(params.file.name.replace(`.${fileExt}`, ''));
    const fileName = `${sanitizedName}_${Date.now()}.${fileExt}`;

    const folder = params.folder || userId;
    const filePath = `${folder}/${fileName}`;

    console.log(`[UPLOAD] Uploading to ${bucket}/${filePath}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, params.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[UPLOAD] Upload failed:', error);
      throw new Error(error.message);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('[UPLOAD] Upload successful:', data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  });
}

/**
 * Upload multiple files
 */
export async function uploadFiles(files: File[], params?: Omit<UploadParams, 'file'>): Promise<ApiResult<UploadData[]>> {
  return safeApiCall(async () => {
    const results: UploadData[] = [];

    for (const file of files) {
      const result = await uploadFile({ ...params, file });
      if (!result.ok) {
        throw new Error(result.error);
      }
      results.push(result.data);
    }

    return results;
  });
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<ApiResult<void>> {
  return safeApiCall(async () => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(error.message);
    }
  });
}

export interface SignedUrlData {
  url: string;
}

/**
 * Get signed URL for private file
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<ApiResult<SignedUrlData>> {
  return safeApiCall(async () => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(error.message);
    }

    return {
      url: data.signedUrl,
    };
  });
}

/**
 * List files in bucket
 */
export async function listFiles(bucket: string, folder?: string): Promise<ApiResult<any[]>> {
  return safeApiCall(async () => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('[UPLOAD] Error listing files:', error);
      throw error;
    }

    return data || [];
  });
}

/**
 * Delete image from both storage and database
 */
export async function deleteImage(userId: string, imageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('storage_path, bucket')
      .eq('id', imageId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!image) {
      return { success: false, error: 'Image not found' };
    }

    const { error: storageError } = await supabase.storage
      .from(image.bucket)
      .remove([image.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return { success: true };
  } catch (err: any) {
    console.error('Image delete failed:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}
