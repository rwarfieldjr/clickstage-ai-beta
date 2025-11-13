import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTheme } from "@/hooks/use-theme";
import { ENV } from "@/config/environment";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("type") === "signup" || searchParams.get("mode") === "signup" ? "signup" : "login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [name, setName] = useState("");

  // Debug logging for Rob
  useEffect(() => {
    console.log("[TURNSTILE DEBUG] Token state:", {
      hasToken: !!turnstileToken,
      tokenLength: turnstileToken.length,
      shouldShowTurnstile,
      timestamp: new Date().toISOString()
    });
  }, [turnstileToken, shouldShowTurnstile]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const turnstileRef = useRef<any>(null);

  // Show Turnstile only after both email and password are filled
  const shouldShowTurnstile = email.trim().length > 0 && password.trim().length > 0;

  // Reset Turnstile when fields are cleared
  useEffect(() => {
    if (!shouldShowTurnstile) {
      setTurnstileToken("");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }
  }, [shouldShowTurnstile]);

  useEffect(() => {
    // Check if user is already logged in or if this is a password recovery
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isRecovery = hashParams.get('type') === 'recovery';
    
    if (isRecovery) {
      setIsPasswordReset(true);
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();

    console.log("[TURNSTILE] Form submit - checking validation", {
      isSignUp,
      shouldShowTurnstile,
      hasTurnstileToken: !!turnstileToken,
      turnstileToken: turnstileToken.substring(0, 20) + '...'
    });

    // Check Turnstile token if verification is required
    if (shouldShowTurnstile && !turnstileToken) {
      console.error("[TURNSTILE] Validation failed - no token present");
      toast.error("⚠️ Please complete the security verification by clicking the checkbox.", {
        duration: 5000,
      });
      return;
    }

    // Validate password match on signup
    if (isSignUp && password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }

    console.log("[TURNSTILE] Validation passed, proceeding with auth");
    setLoading(true);

    try {
      if (isPasswordReset) {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match. Please try again.");
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) throw error;

        toast.success("✅ Password updated successfully!");
        navigate("/dashboard");
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast.success("✅ Password reset email sent! Check your inbox.");
        setIsForgotPassword(false);
        setEmail("");
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name,
            },
          },
        });

        if (error) throw error;

        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: { email, name }
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't block signup if email fails
        }

        toast.success("✅ Account created successfully! Check your email for confirmation.");
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
        setName("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Logged in successfully!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          {isPasswordReset ? (
            <Card className="max-w-md mx-auto shadow-custom-lg">
              <div className="text-center pt-6 pb-6 px-6">
                <h1 className="text-3xl font-bold mb-3">Welcome to ClickStage Pro</h1>
                <p className="text-muted-foreground text-base">Sign in to your account or create a new one</p>
              </div>
              <CardContent className="px-6 pb-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Set New Password</h2>
                  <p className="text-muted-foreground">Enter your new password below.</p>
                </div>
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 10 characters long
                    </p>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-destructive">
                        Passwords do not match. Please try again.
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90"
                    disabled={loading || password !== confirmPassword}
                  >
                    {loading ? "Loading..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : isForgotPassword ? (
            <Card className="max-w-md mx-auto shadow-custom-lg">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                  <p className="text-muted-foreground">
                    Enter your email to receive a password reset link
                  </p>
                </div>
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Send Reset Link"}
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                  <p>
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="text-accent hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto shadow-custom-lg">
              <div className="text-center pt-6 pb-6 px-6">
                <h1 className="text-3xl font-bold mb-3">Welcome to ClickStage Pro</h1>
                <p className="text-muted-foreground text-base">Sign in to your account or create a new one</p>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6">
                <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
                  <TabsTrigger value="login" className="text-base font-semibold">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-base font-semibold">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="px-6 pb-6">
                  <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={10}
                      />
                    </div>
                    {/* Turnstile - Only shows after email and password are filled */}
                    {shouldShowTurnstile && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Security Verification <span className="text-destructive">*</span></Label>
                        <p className="text-xs text-muted-foreground">Click the checkbox below to verify you're human</p>
                        <div className="flex justify-center">
                          <Turnstile
                            ref={turnstileRef}
                            siteKey={ENV.turnstile.siteKey}
                            onSuccess={(token) => {
                              console.log("[TURNSTILE] ✓ Verification successful (Login)", {
                                tokenLength: token.length,
                                timestamp: new Date().toISOString()
                              });
                              setTurnstileToken(token);
                            }}
                            onError={() => {
                              console.error("[TURNSTILE] ✗ Verification error (Login)");
                              setTurnstileToken("");
                              toast.error("Security verification failed. Please try again.");
                              if (turnstileRef.current) {
                                turnstileRef.current.reset();
                              }
                            }}
                            onExpire={() => {
                              console.warn("[TURNSTILE] ⏰ Token expired (Login)");
                              setTurnstileToken("");
                              toast.error("Security verification expired. Please verify again.");
                              if (turnstileRef.current) {
                                turnstileRef.current.reset();
                              }
                            }}
                            options={{
                              theme: theme === 'dark' ? 'dark' : 'light',
                              execution: 'render',
                              appearance: 'always',
                            }}
                          />
                        </div>
                        {!turnstileToken && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                            ⚠️ You must complete verification before logging in
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={loading || (shouldShowTurnstile && !turnstileToken)}
                    >
                      {loading ? "Loading..." : "Log In"}
                    </Button>
                  </form>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-accent hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="px-6 pb-6">
                  <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={10}
                      />
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 10 characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm Password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={10}
                      />
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-destructive">
                          Passwords do not match. Please try again.
                        </p>
                      )}
                    </div>
                    {/* Turnstile - Only shows after email and password are filled */}
                    {shouldShowTurnstile && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Security Verification <span className="text-destructive">*</span></Label>
                        <p className="text-xs text-muted-foreground">Click the checkbox below to verify you're human</p>
                        <div className="flex justify-center">
                          <Turnstile
                            ref={turnstileRef}
                            siteKey={ENV.turnstile.siteKey}
                            onSuccess={(token) => {
                              console.log("[TURNSTILE] ✓ Verification successful (Signup)", {
                                tokenLength: token.length,
                                timestamp: new Date().toISOString()
                              });
                              setTurnstileToken(token);
                            }}
                            onError={() => {
                              console.error("[TURNSTILE] ✗ Verification error (Signup)");
                              setTurnstileToken("");
                              toast.error("Security verification failed. Please try again.");
                              if (turnstileRef.current) {
                                turnstileRef.current.reset();
                              }
                            }}
                            onExpire={() => {
                              console.warn("[TURNSTILE] ⏰ Token expired (Signup)");
                              setTurnstileToken("");
                              toast.error("Security verification expired. Please verify again.");
                              if (turnstileRef.current) {
                                turnstileRef.current.reset();
                              }
                            }}
                            options={{
                              theme: theme === 'dark' ? 'dark' : 'light',
                              execution: 'render',
                              appearance: 'always',
                            }}
                          />
                        </div>
                        {!turnstileToken && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                            ⚠️ You must complete verification before signing up
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={loading || password !== confirmPassword || (shouldShowTurnstile && !turnstileToken)}
                    >
                      {loading ? "Loading..." : "Sign Up"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;