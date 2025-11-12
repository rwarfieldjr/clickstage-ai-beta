import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const turnstileRef = useRef<any>(null);

  // Check if both email and password are filled to show Turnstile
  const shouldShowTurnstile = email.trim().length > 0 && password.trim().length > 0;

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (data) {
          navigate("/admin/dashboard");
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if Turnstile is verified when fields are filled
    if (shouldShowTurnstile && !turnstileVerified) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          await supabase.auth.signOut();
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
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      // Reset Turnstile on error
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
                <div className="flex justify-center py-2">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey="0x4AAAAAAB9xdhqE9Qyud_D6"
                    options={{
                      theme: "light",
                      size: "normal",
                      appearance: "always", // Force manual checkbox verification
                    }}
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setTurnstileVerified(true);
                      setShowWarning(false);
                    }}
                    onError={() => {
                      setTurnstileVerified(false);
                      setTurnstileToken("");
                      if (turnstileRef.current) {
                        turnstileRef.current.reset();
                      }
                    }}
                    onExpire={() => {
                      setTurnstileVerified(false);
                      setTurnstileToken("");
                      if (turnstileRef.current) {
                        turnstileRef.current.reset();
                      }
                    }}
                  />
                </div>
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
