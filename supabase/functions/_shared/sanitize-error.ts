/**
 * Sanitizes error messages to prevent leaking internal system details
 * Returns safe, user-friendly error messages
 */

const SAFE_ERROR_MESSAGES: Record<string, string> = {
  'Unauthorized': 'Authentication required',
  'Forbidden': 'Access denied',
  'Insufficient credits': 'Insufficient credits',
  'Invalid token': 'Security verification failed',
  'User not found': 'Account not found',
  'Invalid input': 'Invalid input provided',
  'Rate limit exceeded': 'Too many requests. Please try again later.',
  'Payment failed': 'Payment processing failed',
  'Session expired': 'Your session has expired',
};

const ERROR_CODES: Record<string, string> = {
  'Unauthorized': 'AUTH_REQUIRED',
  'Forbidden': 'ACCESS_DENIED',
  'Insufficient credits': 'INSUFFICIENT_CREDITS',
  'Invalid token': 'INVALID_TOKEN',
  'User not found': 'USER_NOT_FOUND',
  'Invalid input': 'INVALID_INPUT',
  'Rate limit exceeded': 'RATE_LIMIT_EXCEEDED',
  'Payment failed': 'PAYMENT_FAILED',
  'Session expired': 'SESSION_EXPIRED',
};

interface SanitizedError {
  error: string;
  code: string;
}

/**
 * Sanitizes an error for safe client response
 * @param error - The error object or message to sanitize
 * @param defaultMessage - Default message if error doesn't match known patterns
 * @returns Sanitized error object with safe message and code
 */
export function sanitizeError(
  error: any,
  defaultMessage: string = 'An error occurred. Please try again or contact support.'
): SanitizedError {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  
  // Check if this is a known safe error
  if (SAFE_ERROR_MESSAGES[errorMessage]) {
    return {
      error: SAFE_ERROR_MESSAGES[errorMessage],
      code: ERROR_CODES[errorMessage] || 'UNKNOWN_ERROR',
    };
  }
  
  // Return generic error for unknown errors
  return {
    error: defaultMessage,
    code: 'INTERNAL_ERROR',
  };
}

/**
 * Creates a JSON error response with sanitized error
 * @param error - The error to sanitize
 * @param status - HTTP status code (default: 500)
 * @param corsHeaders - CORS headers object
 * @returns Response object with sanitized error
 */
export function createErrorResponse(
  error: any,
  status: number = 500,
  corsHeaders: Record<string, string> = {}
): Response {
  const sanitized = sanitizeError(error);
  
  return new Response(
    JSON.stringify(sanitized),
    {
      status,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    }
  );
}
