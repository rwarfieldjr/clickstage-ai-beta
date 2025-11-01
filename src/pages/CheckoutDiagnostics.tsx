/**
 * CHECKOUT DIAGNOSTICS PAGE
 * Debug tool for investigating checkout failures
 * Access at: /diagnostics
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";
import { createSimpleCheckout } from "@/lib/simpleCheckout";
import { PRICING_TIERS } from "@/config/pricing";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

export default function CheckoutDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<string>('');

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    setTestOutput('');
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    console.log('[DIAGNOSTICS] Checking environment variables...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    diagnostics.push({
      name: 'Environment Variables',
      status: (supabaseUrl && supabaseKey && supabaseProjectId) ? 'pass' : 'fail',
      message: (supabaseUrl && supabaseKey && supabaseProjectId)
        ? 'All required environment variables present'
        : 'Missing required environment variables',
      details: {
        VITE_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
        VITE_SUPABASE_PUBLISHABLE_KEY: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING',
        VITE_SUPABASE_PROJECT_ID: supabaseProjectId || 'MISSING',
      }
    });

    // Test 2: Browser Environment
    diagnostics.push({
      name: 'Browser Environment',
      status: 'pass',
      message: 'Browser environment detected',
      details: {
        userAgent: navigator.userAgent,
        isIncognito: 'Unknown',
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      }
    });

    // Test 3: Page URL
    diagnostics.push({
      name: 'Current URL',
      status: 'pass',
      message: `Running on: ${window.location.origin}`,
      details: {
        origin: window.location.origin,
        href: window.location.href,
        protocol: window.location.protocol,
      }
    });

    // Test 4: Price IDs Configuration
    const validPriceIds = PRICING_TIERS.every(tier => tier.priceId.startsWith('price_'));
    diagnostics.push({
      name: 'Price IDs Configuration',
      status: validPriceIds ? 'pass' : 'fail',
      message: validPriceIds
        ? `All ${PRICING_TIERS.length} pricing tiers have valid format`
        : 'Some price IDs have invalid format',
      details: {
        tiers: PRICING_TIERS.map(t => ({
          name: t.name,
          priceId: t.priceId,
          valid: t.priceId.startsWith('price_')
        }))
      }
    });

    // Test 5: Try Creating Checkout Session (with first tier)
    console.log('[DIAGNOSTICS] Testing checkout creation...');
    const testPriceId = PRICING_TIERS[0].priceId;
    
    try {
      const result = await createSimpleCheckout(testPriceId);
      
      diagnostics.push({
        name: 'Checkout Creation Test',
        status: result.success ? 'pass' : 'fail',
        message: result.success
          ? 'Successfully created checkout session'
          : `Failed: ${result.error}`,
        details: {
          priceId: testPriceId,
          success: result.success,
          hasUrl: !!result.url,
          url: result.url ? result.url.substring(0, 50) + '...' : null,
          sessionId: result.sessionId,
          error: result.error,
        }
      });
    } catch (err: any) {
      diagnostics.push({
        name: 'Checkout Creation Test',
        status: 'fail',
        message: `Exception: ${err.message}`,
        details: {
          priceId: testPriceId,
          error: err.message,
          stack: err.stack,
        }
      });
    }

    setResults(diagnostics);
    setTesting(false);

    // Generate summary output
    const output = diagnostics.map(d => {
      const icon = d.status === 'pass' ? '✅' : d.status === 'fail' ? '❌' : '⚠️';
      return `${icon} ${d.name}: ${d.message}\n${JSON.stringify(d.details, null, 2)}`;
    }).join('\n\n');
    
    setTestOutput(output);
    console.log('[DIAGNOSTICS] Test complete', { results: diagnostics });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testOutput);
    toast.success('Diagnostics copied to clipboard');
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warn') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warn':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warn') => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warn: 'secondary',
    } as const;
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Checkout Diagnostics</h1>
            <p className="text-muted-foreground">
              Debug tool for investigating checkout failures. Run tests to identify configuration issues.
            </p>
          </div>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This page helps diagnose checkout issues by testing your environment configuration,
              edge function connectivity, and Stripe integration. All tests are logged to the browser console.
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Run Diagnostics</CardTitle>
              <CardDescription>
                Test your checkout configuration and identify any issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runDiagnostics}
                disabled={testing}
                size="lg"
                className="w-full"
              >
                {testing ? 'Running Tests...' : 'Run All Diagnostics'}
              </Button>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Test Results</CardTitle>
                      <CardDescription>
                        {results.filter(r => r.status === 'pass').length} passed,{' '}
                        {results.filter(r => r.status === 'fail').length} failed,{' '}
                        {results.filter(r => r.status === 'warn').length} warnings
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Results
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <span className="font-semibold">{result.name}</span>
                          </div>
                          {getStatusBadge(result.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {result.message}
                        </p>
                        {result.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Console Output</CardTitle>
                  <CardDescription>
                    Check browser console (F12) for detailed logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
                    {testOutput || 'No output yet. Run diagnostics to see results.'}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}

          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Having issues?</strong> Copy the test results above and share them with support.
              All sensitive data is redacted automatically.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
}
