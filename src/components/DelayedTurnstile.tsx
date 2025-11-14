import { useEffect, useRef } from "react";

interface DelayedTurnstileProps {
  onSuccess: (token: string) => void;
  siteKey: string;
}

export default function DelayedTurnstile({ onSuccess, siteKey }: DelayedTurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.turnstile || !ref.current) return;

    const widgetId = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      theme: "light",
      size: "normal",
      action: "purchase",
      "expiration-callback": () => console.log("Turnstile expired"),
      callback: (token: string) => onSuccess(token),
      appearance: "always",
      mode: "interactive",
    });

    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.warn("Turnstile cleanup error:", e);
        }
      }
    };
  }, [siteKey, onSuccess]);

  return <div ref={ref} />;
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}
