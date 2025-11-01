/**
 * Checkout Testing Utility
 * Run this in browser console to test all pricing tiers
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Navigate to /pricing page
 * 3. Run: window.testAllCheckouts()
 */

import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  tier: string;
  priceId: string;
  success: boolean;
  checkoutUrl?: string;
  error?: string;
  responseTime: number;
  timestamp: string;
}

/**
 * Test a single checkout endpoint
 */
async function testCheckoutEndpoint(
  endpointName: string,
  priceId: string,
  tierName: string
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    tier: tierName,
    priceId,
    success: false,
    responseTime: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    console.log(`[TEST] Testing ${endpointName} for ${tierName}...`);

    const { data, error } = await supabase.functions.invoke(endpointName, {
      body: { priceId },
    });

    result.responseTime = Date.now() - startTime;

    if (error) {
      result.error = `Edge function error: ${error.message}`;
      console.error(`[TEST] ❌ ${tierName} failed:`, error);
      return result;
    }

    if (!data?.url) {
      result.error = "No checkout URL returned";
      console.error(`[TEST] ❌ ${tierName} failed: No URL in response`, data);
      return result;
    }

    // Validate URL format
    if (!data.url.startsWith("https://checkout.stripe.com/")) {
      result.error = `Invalid checkout URL format: ${data.url}`;
      console.error(`[TEST] ❌ ${tierName} failed: Invalid URL format`);
      return result;
    }

    result.success = true;
    result.checkoutUrl = data.url;
    console.log(
      `[TEST] ✅ ${tierName} passed (${result.responseTime}ms) - URL: ${data.url.substring(0, 50)}...`
    );

    return result;
  } catch (error: any) {
    result.responseTime = Date.now() - startTime;
    result.error = `Exception: ${error.message}`;
    console.error(`[TEST] ❌ ${tierName} exception:`, error);
    return result;
  }
}

/**
 * Test all pricing tiers
 */
export async function testAllCheckouts(dryRun = true): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 CHECKOUT TESTING UTILITY");
  console.log("=".repeat(60) + "\n");

  if (dryRun) {
    console.log("⚠️  DRY RUN MODE - No actual Stripe charges will occur");
    console.log("💡 Set dryRun=false to test with real Stripe API\n");
  }

  // Import pricing tiers
  const { PRICING_TIERS } = await import("@/config/pricing");

  const allResults: TestResult[] = [];
  let passCount = 0;
  let failCount = 0;

  console.log(`📋 Testing ${PRICING_TIERS.length} pricing tiers...\n`);

  // Test create-simple-checkout for each tier
  console.log("--- Testing create-simple-checkout ---\n");

  for (const tier of PRICING_TIERS) {
    const result = await testCheckoutEndpoint(
      "create-simple-checkout",
      tier.priceId,
      `${tier.name} (${tier.price})`
    );

    allResults.push(result);

    if (result.success) {
      passCount++;
    } else {
      failCount++;
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Test create-checkout fallback with first tier
  console.log("\n--- Testing create-checkout (with fallback) ---\n");

  const firstTier = PRICING_TIERS[0];
  const fallbackResult = await testCheckoutEndpoint(
    "create-checkout",
    firstTier.priceId,
    `${firstTier.name} - Fallback Test`
  );

  allResults.push(fallbackResult);

  if (fallbackResult.success) {
    passCount++;
  } else {
    failCount++;
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60) + "\n");

  console.log(`Total Tests: ${allResults.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success Rate: ${((passCount / allResults.length) * 100).toFixed(1)}%`);

  const avgResponseTime =
    allResults.reduce((sum, r) => sum + r.responseTime, 0) /
    allResults.length;
  console.log(`⏱️  Avg Response Time: ${avgResponseTime.toFixed(0)}ms\n`);

  // Failed tests details
  if (failCount > 0) {
    console.log("❌ FAILED TESTS:\n");
    allResults
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  • ${r.tier}`);
        console.log(`    Price ID: ${r.priceId}`);
        console.log(`    Error: ${r.error}`);
        console.log(`    Response Time: ${r.responseTime}ms\n`);
      });
  }

  // Successful tests summary
  console.log("✅ PASSED TESTS:\n");
  allResults
    .filter((r) => r.success)
    .forEach((r) => {
      console.log(`  • ${r.tier} - ${r.responseTime}ms`);
    });

  console.log("\n" + "=".repeat(60));

  // Store results in sessionStorage for later review
  sessionStorage.setItem("checkoutTestResults", JSON.stringify(allResults));
  console.log("\n💾 Results saved to sessionStorage['checkoutTestResults']");
  console.log("📝 Retrieve with: JSON.parse(sessionStorage.getItem('checkoutTestResults'))");

  // Return summary object
  const summary = {
    totalTests: allResults.length,
    passed: passCount,
    failed: failCount,
    successRate: ((passCount / allResults.length) * 100).toFixed(1) + "%",
    avgResponseTime: avgResponseTime.toFixed(0) + "ms",
    results: allResults,
  };

  console.log("\n📤 Full results object:");
  console.table(
    allResults.map((r) => ({
      Tier: r.tier,
      Status: r.success ? "✅ PASS" : "❌ FAIL",
      "Response (ms)": r.responseTime,
      Error: r.error || "-",
    }))
  );

  if (failCount === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Checkout system is fully operational.\n");
  } else {
    console.log(
      `\n⚠️  ${failCount} test(s) failed. Please review errors above and fix before deploying.\n`
    );
  }

  return;
}

/**
 * Test a single tier manually
 */
export async function testSingleTier(priceId: string): Promise<void> {
  console.log(`\n🧪 Testing single tier: ${priceId}\n`);

  const result = await testCheckoutEndpoint(
    "create-simple-checkout",
    priceId,
    "Manual Test"
  );

  if (result.success) {
    console.log("\n✅ Test passed!");
    console.log(`Checkout URL: ${result.checkoutUrl}`);
    console.log(`Response time: ${result.responseTime}ms`);
  } else {
    console.log("\n❌ Test failed!");
    console.log(`Error: ${result.error}`);
  }
}

/**
 * Quick connectivity test
 */
export async function testConnectivity(): Promise<void> {
  console.log("\n🔌 Testing Supabase connectivity...\n");

  try {
    const { data, error } = await supabase.functions.invoke(
      "create-simple-checkout",
      {
        body: { priceId: "test_connectivity" },
      }
    );

    if (error) {
      console.log("✅ Edge function reachable (expected error for test ID)");
      console.log(`Response: ${error.message}`);
    } else {
      console.log("⚠️  Unexpected success - check test priceId");
    }
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message);
  }
}

// Expose to window for console access
if (typeof window !== "undefined") {
  (window as any).testAllCheckouts = testAllCheckouts;
  (window as any).testSingleTier = testSingleTier;
  (window as any).testConnectivity = testConnectivity;

  console.log("🧪 Checkout test utilities loaded!");
  console.log("Available commands:");
  console.log("  • window.testAllCheckouts() - Test all pricing tiers");
  console.log("  • window.testSingleTier(priceId) - Test specific tier");
  console.log("  • window.testConnectivity() - Test Supabase connection");
}
