/**
 * API Service Layer Index
 *
 * Central export point for all API services
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function apiOk<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function apiFail<T = never>(error: any): ApiResult<T> {
  const message =
    (error &&
      (error.message ||
        error.error_description ||
        error.toString?.())) ||
    "Unknown error";
  console.error("API error:", error);
  return { ok: false, error: message };
}

/**
 * Generic safe wrapper for async calls.
 * Usage:
 *   return safeApiCall(async () => {
 *     const { data, error } = await something();
 *     if (error) throw error;
 *     return data;
 *   });
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return apiOk(data);
  } catch (err) {
    return apiFail<T>(err);
  }
}

// Authentication
export * from './auth';

// Credits
export * from './credits';

// Orders
export * from './orders';

// Admin
export * from './admin';

// Stripe
export * from './stripe';

// Upload
export * from './upload';