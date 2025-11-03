import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get("type") === "signup" || searchParams.get("mode") === "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match on signup
    if (isSignUp && password !== confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }
    
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });

        if (error) throw error;

        toast.success("✅ Password reset email sent! Check your inbox.");
        setIsForgotPassword(false);
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
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
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
          <Card className="max-w-md mx-auto shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-2xl">
                {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription>
                {isForgotPassword
                  ? "Enter your email to receive a password reset link"
                  : isSignUp
                  ? "Sign up to start staging your photos"
                  : "Log in to your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && !isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                    />
                  </div>
                )}
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
                {!isForgotPassword && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={10}
                      />
                      {isSignUp && (
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 10 characters
                        </p>
                      )}
                      {!isSignUp && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-xs text-accent hover:underline"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>
                    {isSignUp && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
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
                    )}
                  </>
                )}
                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={loading || (isSignUp && password !== confirmPassword)}
                >
                  {loading ? "Loading..." : isForgotPassword ? "Send Reset Link" : isSignUp ? "Sign Up" : "Log In"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                {isForgotPassword ? (
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
                ) : isSignUp ? (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-accent hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-accent hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;