/**
 * Bucket Test Page
 * Tests connectivity and access to all Supabase storage buckets
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, TestTube } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { testAllBuckets, testBucketAccess } from "@/lib/storage";
import { toast } from "sonner";

export default function BucketTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    user?: any;
  } | null>(null);

  const checkAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      setAuthStatus({ isAuthenticated: false });
      toast.error("Auth check failed: " + error.message);
      return false;
    }

    if (!session) {
      setAuthStatus({ isAuthenticated: false });
      toast.error("Not authenticated. Please log in first.");
      return false;
    }

    setAuthStatus({
      isAuthenticated: true,
      user: {
        email: session.user.email,
        id: session.user.id
      }
    });

    toast.success("Authenticated as: " + session.user.email);
    return true;
  };

  const runTests = async () => {
    setTesting(true);
    setResults(null);

    try {
      // First check auth
      const isAuth = await checkAuth();
      if (!isAuth) {
        setTesting(false);
        return;
      }

      // Test all buckets
      const bucketResults = await testAllBuckets();

      // Get environment info
      const envInfo = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "NOT SET",
        projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "NOT SET",
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      };

      setResults({
        ...bucketResults,
        envInfo,
        timestamp: new Date().toISOString()
      });

      if (bucketResults.errors.length === 0) {
        toast.success("All buckets accessible!");
      } else {
        toast.error(`${bucketResults.errors.length} bucket(s) failed`);
      }
    } catch (err: any) {
      console.error("[BUCKET TEST] Error:", err);
      toast.error("Test failed: " + err.message);
      setResults({
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const testIndividualBucket = async (bucketName: string) => {
    setTesting(true);
    try {
      const result = await testBucketAccess(bucketName);
      if (result.success) {
        toast.success(`✓ ${bucketName} is accessible`);
      } else {
        toast.error(`✗ ${bucketName}: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Error testing ${bucketName}: ` + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-6 w-6" />
              Storage Bucket Diagnostics
            </CardTitle>
            <CardDescription>
              Test connectivity and access to Supabase storage buckets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auth Status */}
            {authStatus && (
              <Alert className={authStatus.isAuthenticated ? "border-green-500" : "border-red-500"}>
                <AlertDescription>
                  {authStatus.isAuthenticated ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Authenticated as: {authStatus.user?.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Not authenticated. Please log in first.</span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Test Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={runTests}
                disabled={testing}
                className="gap-2"
              >
                {testing && <Loader2 className="h-4 w-4 animate-spin" />}
                Run Full Test
              </Button>

              <Button
                onClick={() => testIndividualBucket('uploads')}
                disabled={testing}
                variant="outline"
              >
                Test Uploads
              </Button>

              <Button
                onClick={() => testIndividualBucket('staged')}
                disabled={testing}
                variant="outline"
              >
                Test Staged
              </Button>

              <Button
                onClick={() => testIndividualBucket('avatars')}
                disabled={testing}
                variant="outline"
              >
                Test Avatars
              </Button>

              <Button
                onClick={checkAuth}
                disabled={testing}
                variant="outline"
              >
                Check Auth
              </Button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Test Results</h3>

                {/* Environment Info */}
                {results.envInfo && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-medium">Environment Configuration:</p>
                    <ul className="text-sm space-y-1 font-mono">
                      <li>URL: {results.envInfo.supabaseUrl}</li>
                      <li>Project ID: {results.envInfo.projectId}</li>
                      <li>Has Anon Key: {results.envInfo.hasAnonKey ? "✓" : "✗"}</li>
                    </ul>
                  </div>
                )}

                {/* Bucket Status */}
                <div className="space-y-2">
                  {typeof results.uploads !== 'undefined' && (
                    <BucketStatus name="uploads" success={results.uploads} />
                  )}
                  {typeof results.staged !== 'undefined' && (
                    <BucketStatus name="staged" success={results.staged} />
                  )}
                  {typeof results.avatars !== 'undefined' && (
                    <BucketStatus name="avatars" success={results.avatars} />
                  )}
                </div>

                {/* Errors */}
                {results.errors && results.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <p className="font-semibold mb-2">Errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {results.errors.map((error: string, idx: number) => (
                          <li key={idx} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* General Error */}
                {results.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{results.error}</AlertDescription>
                  </Alert>
                )}

                <p className="text-xs text-muted-foreground">
                  Test run at: {new Date(results.timestamp).toLocaleString()}
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
              <p className="font-medium">Troubleshooting:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>If not authenticated, go to <a href="/auth" className="underline">Login Page</a></li>
                <li>If buckets not found, check Supabase Dashboard → Storage</li>
                <li>Verify environment variables in .env file</li>
                <li>Check browser console for detailed error messages</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function BucketStatus({ name, success }: { name: string; success: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded ${success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
      {success ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <span className="font-medium">{name}</span>
      <span className="text-sm text-muted-foreground">
        {success ? "Accessible" : "Not Found"}
      </span>
    </div>
  );
}
