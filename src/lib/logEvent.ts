export async function logEvent(eventName: string, data?: Record<string, any>): Promise<void> {
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        eventName, 
        data,
        timestamp: Date.now()
      }),
    });
  } catch (error) {
    // Silently fail - don't block user flow if logging fails
    console.error("Failed to log event:", eventName, error);
  }
}
