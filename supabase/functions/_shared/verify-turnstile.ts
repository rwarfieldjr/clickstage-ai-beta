/**
 * Verify Cloudflare Turnstile token
 * @param token - The turnstile token from the client
 * @returns true if verification succeeds, false otherwise
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token) {
    console.error('[verify-turnstile] No token provided');
    return false;
  }

  const secretKey = Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET');
  if (!secretKey) {
    console.error('[verify-turnstile] CLOUDFLARE_TURNSTILE_SECRET not configured');
    return false;
  }

  try {
    console.log('[verify-turnstile] Verifying token with Cloudflare...');
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.error('[verify-turnstile] Verification failed:', {
        errorCodes,
        // Common error codes:
        // 'missing-input-secret' - secret key not provided
        // 'invalid-input-secret' - secret key is invalid
        // 'missing-input-response' - token not provided
        // 'invalid-input-response' - token is invalid or expired
        // 'timeout-or-duplicate' - token expired or was already used
      });
      
      // Log specific error messages for common issues
      if (errorCodes.includes('timeout-or-duplicate')) {
        console.error('[verify-turnstile] Token expired or already used');
      }
      if (errorCodes.includes('invalid-input-response')) {
        console.error('[verify-turnstile] Invalid or expired token');
      }
      
      return false;
    }

    console.log('[verify-turnstile] Verification successful');
    return true;
  } catch (error) {
    console.error('[verify-turnstile] Error during verification:', error);
    return false;
  }
}
