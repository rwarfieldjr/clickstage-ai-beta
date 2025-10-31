import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// File validation constants
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Magic bytes for file type detection
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
};

/**
 * Validates file by reading magic bytes from the beginning of the file
 * to ensure the MIME type matches actual file content
 */
function validateFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType as keyof typeof FILE_SIGNATURES];
  if (!signature) return false;

  // For WebP, we need to also check for "WEBP" after RIFF
  if (mimeType === 'image/webp') {
    const riffMatch = signature.every((byte, i) => bytes[i] === byte);
    if (!riffMatch) return false;
    
    // Check for "WEBP" at bytes 8-11
    const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
    return webpSignature.every((byte, i) => bytes[8 + i] === byte);
  }

  // For JPEG and PNG, check the signature bytes
  return signature.every((byte, i) => bytes[i] === byte);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[validate-upload] Received validation request");

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "No files provided for validation" 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[validate-upload] Validating ${files.length} file(s)`);

    const validationResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[validate-upload] Checking file ${i + 1}: ${file.name}, type: ${file.type}, size: ${file.size}`);

      // Validate MIME type
      if (!ALLOWED_TYPES.includes(file.type)) {
        validationResults.push({
          fileName: file.name,
          valid: false,
          error: `Invalid file type. Only JPG, PNG, or WEBP images are allowed. Received: ${file.type}`
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        validationResults.push({
          fileName: file.name,
          valid: false,
          error: `File too large (${sizeMB}MB). Maximum size is ${MAX_SIZE_MB}MB per file.`
        });
        continue;
      }

      // Validate file signature by reading first bytes
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Read first 12 bytes (enough for all our signatures)
        const headerBytes = bytes.slice(0, 12);
        
        const signatureValid = validateFileSignature(headerBytes, file.type);
        
        if (!signatureValid) {
          validationResults.push({
            fileName: file.name,
            valid: false,
            error: `File content does not match declared type ${file.type}. File may be corrupted or have incorrect extension.`
          });
          continue;
        }

        // File passed all validations
        validationResults.push({
          fileName: file.name,
          valid: true,
          size: file.size,
          type: file.type
        });

        console.log(`[validate-upload] File ${file.name} passed all validations`);

      } catch (error) {
        console.error(`[validate-upload] Error reading file ${file.name}:`, error);
        validationResults.push({
          fileName: file.name,
          valid: false,
          error: "Failed to read file content for validation"
        });
      }
    }

    // Check if all files are valid
    const allValid = validationResults.every(result => result.valid);
    const invalidFiles = validationResults.filter(result => !result.valid);

    if (!allValid) {
      console.log(`[validate-upload] Validation failed. Invalid files:`, invalidFiles);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          results: validationResults,
          invalidFiles: invalidFiles,
          error: `${invalidFiles.length} file(s) failed validation`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[validate-upload] All files validated successfully`);
    return new Response(
      JSON.stringify({ 
        valid: true, 
        results: validationResults,
        message: `All ${files.length} file(s) validated successfully`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[validate-upload] Validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: "File validation failed",
        code: "VALIDATION_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
