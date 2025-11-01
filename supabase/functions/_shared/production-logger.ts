/**
 * PRODUCTION-SAFE LOGGER
 * Prevents sensitive data exposure in production logs
 * Automatically redacts PII and sensitive information
 */

interface LogContext {
  [key: string]: any;
}

const SENSITIVE_KEYS = [
  'email',
  'phone',
  'phone_number',
  'ip',
  'ip_address',
  'token',
  'turnstile',
  'turnstileToken',
  'authorization',
  'password',
  'secret',
  'api_key',
  'stripe_key',
];

/**
 * Redact sensitive information from log data
 */
function redactSensitive(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitive);
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      if (typeof value === 'string') {
        if (lowerKey.includes('email')) {
          // Redact email: user@example.com -> u***@***.com
          const parts = value.split('@');
          if (parts.length === 2) {
            redacted[key] = `${parts[0][0]}***@***.${parts[1].split('.').pop()}`;
          } else {
            redacted[key] = '[REDACTED]';
          }
        } else if (lowerKey.includes('ip')) {
          // Redact IP: 192.168.1.1 -> 192.xxx.xxx.xxx
          const parts = value.split('.');
          if (parts.length === 4) {
            redacted[key] = `${parts[0]}.xxx.xxx.xxx`;
          } else {
            redacted[key] = '[REDACTED]';
          }
        } else if (lowerKey.includes('phone')) {
          // Redact phone: +1234567890 -> +***7890
          redacted[key] = value.slice(0, 1) + '***' + value.slice(-4);
        } else {
          // Generic redaction
          redacted[key] = '[REDACTED]';
        }
      } else {
        redacted[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Get environment-aware logger
 */
export function getLogger(functionName: string) {
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';

  return {
    debug: (message: string, context?: LogContext) => {
      if (isDevelopment) {
        const safeContext = context ? redactSensitive(context) : {};
        console.log(`[${functionName}] DEBUG: ${message}`, safeContext);
      }
    },
    
    info: (message: string, context?: LogContext) => {
      const safeContext = context ? redactSensitive(context) : {};
      console.log(`[${functionName}] INFO: ${message}`, safeContext);
    },
    
    warn: (message: string, context?: LogContext) => {
      const safeContext = context ? redactSensitive(context) : {};
      console.warn(`[${functionName}] WARN: ${message}`, safeContext);
    },
    
    error: (message: string, context?: LogContext) => {
      const safeContext = context ? redactSensitive(context) : {};
      console.error(`[${functionName}] ERROR: ${message}`, safeContext);
    },
    
    // Legacy support for existing logStep calls
    step: (step: string, details?: any) => {
      const safeDetails = details ? redactSensitive(details) : {};
      const detailsStr = details ? ` - ${JSON.stringify(safeDetails)}` : '';
      console.log(`[${functionName}] ${step}${detailsStr}`);
    }
  };
}
