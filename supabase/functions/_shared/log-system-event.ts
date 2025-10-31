import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

/**
 * Logs system events to system_logs table for comprehensive monitoring
 * @param event - Event name/description
 * @param severity - Event severity level
 * @param userId - Optional user ID
 * @param path - Optional request path
 * @param payload - Optional additional data
 */
export async function logSystemEvent(
  event: string,
  severity: 'info' | 'warn' | 'error' | 'critical',
  userId?: string,
  path?: string,
  payload?: any
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[log-system-event] Missing Supabase credentials');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase.from('system_logs').insert({
      timestamp: new Date().toISOString(),
      event,
      severity,
      user_id: userId || null,
      path: path || null,
      payload: payload || null
    });

    if (error) {
      console.error('[log-system-event] Failed to log event:', error);
    } else {
      console.log(`[log-system-event] ${severity.toUpperCase()}: ${event}`);
    }
  } catch (e) {
    console.error('[log-system-event] Exception:', e);
  }
}
