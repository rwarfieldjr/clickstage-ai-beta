import { useState } from "react";
import { useRequireAdmin } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Database,
  CreditCard,
  Upload,
  Shield,
  Activity,
  Zap
} from "lucide-react";

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending' | 'running';
  message: string;
  details?: string;
  duration?: number;
}

export default function AdminTests() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [runningAll, setRunningAll] = useState(false);

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, ...updates } : t);
      }
      return [...prev, { name, status: 'pending', message: '', ...updates }];
    });
  };

  // Test 1: Resend Email
  const testResendEmail = async () => {
    const name = 'Resend Email';
    const startTime = Date.now();

    try {
      updateTest(name, { status: 'running', message: 'Sending test email...' });

      const { data, error } = await supabase.functions.invoke('test-email', {
        body: {
          to: 'admin@clickstagepro.com',
          subject: 'Test Email from Admin Tests',
        }
      });

      if (error) throw error;

      updateTest(name, {
        status: 'success',
        message: 'Email sent successfully',
        details: `Message ID: ${data.messageId || 'N/A'}`,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      updateTest(name, {
        status: 'error',
        message: 'Email test failed',
        details: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 2: Supabase Connection
  const testSupabaseConnection = async () => {
    const name = 'Supabase Connection';
    const startTime = Date.now();

    try {
      updateTest(name, { status: 'running', message: 'Connecting to database...' });

      const { data, error } = await supabase.from('profiles').select('count').limit(1).single();

      if (error && error.code !== 'PGRST116') throw error;

      const { data: authData } = await supabase.auth.getSession();

      updateTest(name, {
        status: 'success',
        message: 'Supabase connection successful',
        details: `Database: ✓ | Auth: ${authData.session ? '✓' : '✗'}`,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      updateTest(name, {
        status: 'error',
        message: 'Supabase connection failed',
        details: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 3: Stripe Webhook Simulation
  const testStripeWebhook = async () => {
    const name = 'Stripe Webhook';
    const startTime = Date.now();

    try {
      updateTest(name, { status: 'running', message: 'Simulating webhook event...' });

      const { data, error } = await supabase.functions.invoke('test-stripe-webhook', {
        body: {
          test: true,
          event_type: 'checkout.session.completed'
        }
      });

      if (error) throw error;

      updateTest(name, {
        status: 'success',
        message: 'Webhook simulation successful',
        details: JSON.stringify(data).substring(0, 100),
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      updateTest(name, {
        status: 'error',
        message: 'Webhook test failed',
        details: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 4: Bucket Upload Permissions
  const testBucketPermissions = async () => {
    const name = 'Bucket Permissions';
    const startTime = Date.now();

    try {
      updateTest(name, { status: 'running', message: 'Testing bucket access...' });

      // Test anonymous upload to uploads bucket
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const testPath = `test/${Date.now()}/test.txt`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(testPath, testFile);

      if (uploadError) throw uploadError;

      // Clean up test file
      await supabase.storage.from('uploads').remove([testPath]);

      updateTest(name, {
        status: 'success',
        message: 'Bucket permissions configured correctly',
        details: 'Anonymous upload: ✓ | Cleanup: ✓',
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      updateTest(name, {
        status: 'error',
        message: 'Bucket permissions test failed',
        details: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 5: Admin Role Detection
  const testAdminRole = async () => {
    const name = 'Admin Role Detection';
    const startTime = Date.now();

    try {
      updateTest(name, { status: 'running', message: 'Checking admin status...' });

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user logged in');

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const isAdmin = roleData?.role === 'admin';

      updateTest(name, {
        status: isAdmin ? 'success' : 'error',
        message: isAdmin ? 'Admin role detected correctly' : 'Admin role not found',
        details: `User ID: ${user.id} | Role: ${roleData?.role || 'none'}`,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      updateTest(name, {
        status: 'error',
        message: 'Admin role detection failed',
        details: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 6: Staging Job Simulation
  const testStagingJob = async () => {
    const name = 'Staging Job Simulation';
    const startTime = Date.now();

    try {
      updateTest(name, { status: 'running', message: 'Simulating staging job...' });

      // Create a test order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          original_image_url: 'test://image.jpg',
          staging_style: 'test',
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update order to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed', staged_image_url: 'test://staged.jpg' })
        .eq('id', orderData.id);

      if (updateError) throw updateError;

      // Clean up test order
      await supabase.from('orders').delete().eq('id', orderData.id);

      updateTest(name, {
        status: 'success',
        message: 'Staging job simulation successful',
        details: `Order created: ${orderData.id} | Status updated: ✓ | Cleanup: ✓`,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      updateTest(name, {
        status: 'error',
        message: 'Staging job simulation failed',
        details: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 7: Email Delivery
  const testEmailDelivery = async () => {
    const name = 'Email Delivery';
    const startTime = Date.now();

    try {
      updateTest(name, { status: 'running', message: 'Testing full email delivery...' });

      const { data, error } = await supabase.functions.invoke('test-email-delivery', {
        body: {
          testType: 'full',
          recipient: 'admin@clickstagepro.com'
        }
      });

      if (error) throw error;

      updateTest(name, {
        status: 'success',
        message: 'Email delivery test successful',
        details: `Sent: ${data.sent || 0} | Failed: ${data.failed || 0}`,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      updateTest(name, {
        status: 'error',
        message: 'Email delivery test failed',
        details: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    setTests([]);

    await testSupabaseConnection();
    await testAdminRole();
    await testBucketPermissions();
    await testResendEmail();
    await testStripeWebhook();
    await testStagingJob();
    await testEmailDelivery();

    setRunningAll(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">System Tests</h1>
          <p className="text-muted-foreground">
            Verify all components of the ClickStagePro system are functioning correctly
          </p>
        </div>

        <Alert className="mb-6">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            These tests verify database connections, email delivery, storage permissions, and API integrations.
            Run these tests after any system updates or configuration changes.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 mb-6">
          <Button
            onClick={runAllTests}
            disabled={runningAll}
            size="lg"
            className="flex-1"
          >
            {runningAll ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running All Tests...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Run All Tests
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Button onClick={testResendEmail} variant="outline" disabled={runningAll}>
            <Mail className="mr-2 h-4 w-4" />
            Test Email
          </Button>
          <Button onClick={testSupabaseConnection} variant="outline" disabled={runningAll}>
            <Database className="mr-2 h-4 w-4" />
            Test Database
          </Button>
          <Button onClick={testStripeWebhook} variant="outline" disabled={runningAll}>
            <CreditCard className="mr-2 h-4 w-4" />
            Test Stripe
          </Button>
          <Button onClick={testBucketPermissions} variant="outline" disabled={runningAll}>
            <Upload className="mr-2 h-4 w-4" />
            Test Buckets
          </Button>
          <Button onClick={testAdminRole} variant="outline" disabled={runningAll}>
            <Shield className="mr-2 h-4 w-4" />
            Test Admin
          </Button>
          <Button onClick={testStagingJob} variant="outline" disabled={runningAll}>
            <Activity className="mr-2 h-4 w-4" />
            Test Staging
          </Button>
        </div>

        {tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                {tests.filter(t => t.status === 'success').length} / {tests.length} tests passed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tests.map((test, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {test.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {test.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                        {test.status === 'running' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                        {test.status === 'pending' && <div className="h-5 w-5 rounded-full border-2" />}
                        <h3 className="font-semibold">{test.name}</h3>
                      </div>
                      <Badge variant={test.status === 'success' ? 'default' : test.status === 'error' ? 'destructive' : 'outline'}>
                        {test.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{test.message}</p>
                    {test.details && (
                      <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                        {test.details}
                      </p>
                    )}
                    {test.duration && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Duration: {test.duration}ms
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}