import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { generateStabilityReport, runCheckoutTest } from "@/lib/stabilityCheck";

/**
 * Stability Test Page
 * 
 * This page provides a UI for running comprehensive stability checks
 * on the checkout and Turnstile integration.
 */
export default function StabilityTest() {
  useEffect(() => {
    // Auto-run stability check on page load
    generateStabilityReport();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Checkout Stability Test</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Comprehensive Stability Check</CardTitle>
            <CardDescription>
              Run automated checks to verify the checkout system is functioning correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This test verifies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>✓ Only one Turnstile widget is rendered per page</li>
              <li>✓ Edge functions return consistent 2xx responses</li>
              <li>✓ Retry logic triggers correctly on 5xx errors (1s, 2s backoff)</li>
              <li>✓ Turnstile token is verified server-side</li>
              <li>✓ Order submission completes successfully</li>
              <li>✓ User credits/payments are updated atomically</li>
            </ul>
            
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => {
                  generateStabilityReport();
                }}
                variant="default"
              >
                Run Stability Check
              </Button>
              
              <Button 
                onClick={() => {
                  runCheckoutTest();
                }}
                variant="outline"
              >
                Show Test Instructions
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Check your browser console for detailed results:</p>
              <code className="text-xs">
                Open DevTools → Console → Filter for "[STABILITY-CHECK]"
              </code>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Manual Checkout Test</CardTitle>
            <CardDescription>
              Test the complete checkout flow with real data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Navigate to the /upload page</li>
              <li>Upload test images</li>
              <li>Select staging style and bundle</li>
              <li>Complete Turnstile verification</li>
              <li>Submit the form</li>
              <li>Monitor console logs for success/failure indicators</li>
            </ol>
            
            <div className="mt-6 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Expected Console Output:</p>
              <pre className="text-xs whitespace-pre-wrap">
{`[STABILITY-CHECK] ✓ Turnstile widget rendered successfully
[STABILITY-CHECK] ✓ Turnstile verification successful
[STABILITY-CHECK] ✓ All pre-flight checks passed
[STABILITY-CHECK] Starting checkout validation
[STABILITY-CHECK] Calling edge function: validate-upload
[STABILITY-CHECK] validate-upload response - Status: 200
[STABILITY-CHECK] ✓ validate-upload succeeded
[STABILITY-CHECK] Calling edge function: create-checkout
[STABILITY-CHECK] create-checkout response - Status: 200
[STABILITY-CHECK] ✓ Checkout session created successfully`}
              </pre>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/upload'}
              className="mt-4"
            >
              Go to Upload Page
            </Button>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Retry Logic</CardTitle>
            <CardDescription>
              Verify that 5xx errors trigger automatic retries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To test the retry mechanism:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Open Network tab in DevTools</li>
              <li>Enable "Offline" mode temporarily during checkout</li>
              <li>Or use a network throttling tool to simulate 5xx errors</li>
              <li>Observe retry attempts in console logs</li>
            </ol>
            
            <div className="mt-6 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Expected Retry Behavior:</p>
              <pre className="text-xs whitespace-pre-wrap">
{`[STABILITY-CHECK] ⚠ function-name temporary failure (5xx), retrying in 1000ms...
[STABILITY-CHECK] function-name response - Status: 500, Attempt: 2/3
[STABILITY-CHECK] ⚠ function-name temporary failure (5xx), retrying in 2000ms...
[STABILITY-CHECK] function-name response - Status: 200, Attempt: 3/3
[STABILITY-CHECK] ✓ function-name succeeded`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
