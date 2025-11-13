import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { ENV } from "@/config/environment";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const turnstileRef = useRef<any>(null);

  // Check if both email and password are filled to show Turnstile
  const shouldShowTurnstile = email.trim().length > 0 && password.trim().length > 0;

  // Debug logging for Rob
  useEffect(() => {
    console.log("[ADMIN TURNSTILE DEBUG] Token state:", {
      hasToken: !!turnstileToken,
      tokenLength: turnstileToken.length,
      isVerified: turnstileVerified,
      shouldShowTurnstile,
      timestamp: new Date().toISOString()
    });
  }, [turnstileToken, turnstileVerified, shouldShowTurnstile]);

  // Reset Turnstile when fields are cleared
  useEffect(() => {
    if (!shouldShowTurnstile) {
      setTurnstileVerified(false);
      setTurnstileToken("");
      setShowWarning(false);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }
  }, [shouldShowTurnstile]);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.isAdmin) {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("[ADMIN TURNSTILE] Form submit - checking validation", {
      shouldShowTurnstile,
      hasTurnstileToken: !!turnstileToken,
      isVerified: turnstileVerified,
      turnstileToken: turnstileToken.substring(0, 20) + '...'
    });

    // Check if Turnstile is verified when fields are filled
    if (shouldShowTurnstile && !turnstileVerified) {
      console.error("[ADMIN TURNSTILE] Validation failed - not verified");
      setShowWarning(true);
      toast({
        title: "Security Verification Required",
        description: "⚠️ Please complete the security verification by clicking the checkbox.",
        variant: "destructive",
      });
      setTimeout(() => setShowWarning(false), 4000);
      return;
    }

    console.log("[ADMIN TURNSTILE] Validation passed, proceeding with login");
    setLoading(true);

    try {
      const result = await authLogin(email, password);

      if (!result.ok) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
        setTurnstileVerified(false);
        setTurnstileToken("");
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        return;
      }

      if (!result.data.isAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        return;
      }

      navigate("/admin/dashboard");
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard.",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      setTurnstileVerified(false);
      setTurnstileToken("");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
              />
            </div>

            {/* Turnstile Security Verification - Only shows after email and password are entered */}
            {shouldShowTurnstile && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Security Verification <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Click the checkbox below to verify you're human</p>
                <div className="flex justify-center py-2">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={ENV.turnstile.siteKey}
                    options={{
                      theme: "light",
                      size: "normal",
                      execution: "render",
                      appearance: "always",
                    }}
                    onSuccess={(token) => {
                      console.log("[ADMIN TURNSTILE] ✓ Verification successful", {
                        tokenLength: token.length,
                        timestamp: new Date().toISOString()
                      });
                      setTurnstileToken(token);
                      setTurnstileVerified(true);
                      setShowWarning(false);
                    }}
                    onError={() => {
                      console.error("[ADMIN TURNSTILE] ✗ Verification error");
                      setTurnstileVerified(false);
                      setTurnstileToken("");
                      toast({
                        title: "Verification Failed",
                        description: "Security verification failed. Please try again.",
                        variant: "destructive",
                      });
                      if (turnstileRef.current) {
                        turnstileRef.current.reset();
                      }
                    }}
                    onExpire={() => {
                      console.warn("[ADMIN TURNSTILE] ⏰ Token expired");
                      setTurnstileVerified(false);
                      setTurnstileToken("");
                      toast({
                        title: "Verification Expired",
                        description: "Security verification expired. Please verify again.",
                        variant: "destructive",
                      });
                      if (turnstileRef.current) {
                        turnstileRef.current.reset();
                      }
                    }}
                  />
                </div>
                {!turnstileVerified && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                    ⚠️ You must complete verification before logging in
                  </p>
                )}
              </div>
            )}

            {/* Warning Message */}
            {showWarning && (
              <div className="text-destructive text-sm text-center font-medium animate-in fade-in duration-300">
                ⚠️ Please complete the security verification before logging in.
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (shouldShowTurnstile && !turnstileVerified)}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
