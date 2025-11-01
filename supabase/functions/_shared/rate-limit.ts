import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

/**
 * Simple in-memory rate limiter for contact form submissions
 * Tracks submissions by email address
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if an email has exceeded the rate limit
 * @param email - Email address to check
 * @param maxAttempts - Maximum attempts allowed (default: 3)
 * @param windowMinutes - Time window in minutes (default: 60)
 * @returns true if rate limit exceeded, false otherwise
 */
export function isRateLimited(
  email: string,
  maxAttempts: number = 3,
  windowMinutes: number = 60
): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  
  const record = rateLimitMap.get(key);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) {
        rateLimitMap.delete(k);
      }
    }
  }
  
  if (!record || record.resetAt < now) {
    // New or expired record
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + (windowMinutes * 60 * 1000)
    });
    return false;
  }
  
  // Existing record within window
  record.count++;
  
  if (record.count > maxAttempts) {
    console.log(`[rate-limit] Email ${email} exceeded limit: ${record.count}/${maxAttempts}`);
    return true;
  }
  
  return false;
}

/**
 * Get remaining attempts for debugging
 */
export function getRemainingAttempts(email: string, maxAttempts: number = 3): number {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = rateLimitMap.get(key);
  
  if (!record || record.resetAt < now) {
    return maxAttempts;
  }
  
  return Math.max(0, maxAttempts - record.count);
}
