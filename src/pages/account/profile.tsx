import Sidebar from "@/components/account/Sidebar";
import { useRequireUser } from "@/hooks/useRequireUser";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProfileSettings() {
  const { user, loading } = useRequireUser();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "");
      setTimezone(user.user_metadata?.timezone || "America/New_York");
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name, timezone }
      });
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      if (error) throw error;
      toast.success("Password updated!");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-8 p-10 min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 bg-white shadow-xl rounded-2xl p-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-gray-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-gray-100 mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="name" className="text-gray-700">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="timezone" className="text-gray-700">Timezone</Label>
            <select
              id="timezone"
              className="w-full border border-gray-300 rounded-lg p-3 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
            </select>
          </div>

          <Button
            onClick={saveProfile}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>

        <hr className="my-8 border-gray-200" />

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
            <p className="text-gray-600">Update your password to keep your account secure</p>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-2"
            />
          </div>

          <Button
            onClick={changePassword}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
