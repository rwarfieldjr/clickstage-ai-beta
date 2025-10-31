/**
 * Sanitizes filenames to prevent path traversal and other security issues
 * @param filename - The original filename
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove any directory path components
  const basename = filename.split(/[/\\]/).pop() || 'file';
  
  // Remove dangerous characters and sequences
  let sanitized = basename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove Windows-forbidden characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\s+/g, '_') // Replace whitespace with underscore
    .replace(/[^\w\-_.]/g, ''); // Keep only alphanumeric, dash, underscore, dot
  
  // Ensure filename is not empty and has reasonable length
  if (sanitized.length === 0) {
    sanitized = 'file';
  }
  
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 250) + '.' + ext;
  }
  
  return sanitized;
}

/**
 * Sanitizes a name for use in filenames
 * @param name - User-provided name
 * @returns Sanitized name safe for use in paths
 */
export function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Only allow alphanumeric, spaces, and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .trim() || 'client';
}
