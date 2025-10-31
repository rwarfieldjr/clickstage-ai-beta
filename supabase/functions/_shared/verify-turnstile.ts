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
      console.error('[verify-turnstile] Verification failed:', data['error-codes']);
      return false;
    }

    console.log('[verify-turnstile] Verification successful');
    return true;
  } catch (error) {
    console.error('[verify-turnstile] Error during verification:', error);
    return false;
  }
}
