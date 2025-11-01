/**
 * Basic HTML sanitization to prevent XSS in email contexts
 * Escapes HTML special characters and removes potentially dangerous tags
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their contents
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their contents
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all HTML tags except safe ones for email
  sanitized = sanitized.replace(/<(?!\/?(?:br|p|b|i|strong|em)\b)[^>]+>/gi, '');
  
  // Escape remaining special characters
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  sanitized = sanitized.replace(/[&<>"'\/]/g, (char) => escapeMap[char] || char);
  
  return sanitized;
}

/**
 * Sanitize text for plain text email contexts
 * Removes all HTML and control characters
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}
