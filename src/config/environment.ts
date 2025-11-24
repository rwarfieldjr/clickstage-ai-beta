/**
 * ENVIRONMENT CONFIGURATION VALIDATOR
 * Ensures all required environment variables are present
 * Fails fast on startup if misconfigured
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    publishableKey: string;
    projectId: string;
  };
  turnstile: {
    siteKey: string;
  };
  isProduction: boolean;
  isDevelopment: boolean;
}

/**
 * Validate and return environment configuration
 * Throws error if any required variable is missing
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  };

  // Validate all required variables are present
  const missing: string[] = [];
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please ensure your .env file is properly configured.`
    );
  }

  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  // Cloudflare Turnstile public site key (safe to store in code)
  const TURNSTILE_SITE_KEY = '0x4AAAAAAB9xdhqE9Qyud_D6';

  return {
    supabase: {
      url: requiredVars.VITE_SUPABASE_URL,
      publishableKey: requiredVars.VITE_SUPABASE_PUBLISHABLE_KEY,
      projectId: requiredVars.VITE_SUPABASE_PROJECT_ID,
    },
    turnstile: {
      siteKey: TURNSTILE_SITE_KEY,
    },
    isProduction,
    isDevelopment,
  };
}

/**
 * Safe logger that respects environment
 * In production: Only logs errors and warnings
 * In development: Logs everything
 */
export const logger = {
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};

// Validate environment on module load
let config: EnvironmentConfig;
try {
  config = getEnvironmentConfig();
  logger.info('Environment configuration validated successfully');
} catch (error) {
  console.error('❌ Environment configuration error:', error);
  throw error;
}

export const ENV = config;
