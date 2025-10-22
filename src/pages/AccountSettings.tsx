import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, User, Mail, Lock, Clock, CreditCard, Coins } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { CreditsSummary } from "@/components/CreditsSummary";

const AccountSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { credits, creditSummary, loading: creditsLoading, refetchCredits } = useCredits(user);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    timezone: "UTC",
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setUser(session.user);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile({
        name: profileData.name || "",
        email: profileData.email || "",
        timezone: profileData.timezone || "UTC",
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          timezone: profile.timezone,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update email if changed
      if (profile.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profile.email,
        });
        if (emailError) throw emailError;
        toast.success("Email update initiated. Please check your inbox to confirm.");
      }

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });
      if (error) throw error;

      setPasswords({ newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = (priceId: string, credits: number, bundleName: string, bundlePrice: string) => {
    if (!user) return;

    // Store bundle info for upload page
    const bundle = {
      id: `${credits}-photos`,
      name: bundleName,
      price: bundlePrice,
      priceId: priceId,
      photos: credits,
    };

    localStorage.setItem('selectedBundle', JSON.stringify(bundle));
    
    // Navigate to upload page
    navigate('/upload');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const creditBundles = [
    { name: "5 Photos", price: "$45", priceId: "price_1SD8nJIG3TLqP9yaGAjd2WdP", credits: 5 },
    { name: "10 Photos", price: "$85", priceId: "price_1SD8nNIG3TLqP9yazPngAIN0", credits: 10 },
    { name: "20 Photos", price: "$160", priceId: "price_1SD8nQIG3TLqP9yaBVVV1coG", credits: 20 },
    { name: "50 Photos", price: "$375", priceId: "price_1SD8nTIG3TLqP9yaT0hRMNFq", credits: 50 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-primary">Account Settings</h1>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex gap-2">
                    <Mail className="w-5 h-5 mt-2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <div className="flex gap-2">
                    <Clock className="w-5 h-5 mt-2 text-muted-foreground" />
                    <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleUpdateProfile} disabled={loading}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button onClick={handleUpdatePassword} disabled={loading}>
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Credits Management */}
            <CreditsSummary summary={creditSummary} loading={creditsLoading} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Purchase More Credits
                </CardTitle>
                <CardDescription>Add more credits to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creditBundles.map((bundle) => (
                    <Card key={bundle.name} className="border-2 hover:border-primary transition-smooth">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{bundle.name}</h3>
                            <p className="text-2xl font-bold text-primary">{bundle.price}</p>
                          </div>
                          <Coins className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handlePurchaseCredits(bundle.priceId, bundle.credits, bundle.name, bundle.price)}
                          disabled={loading}
                        >
                          Purchase
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettings;