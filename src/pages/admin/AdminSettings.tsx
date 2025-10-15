import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Trash2, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

export default function AdminSettings() {
  const { isAdmin, loading, requireAdmin } = useAdmin();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    requireAdmin();
  }, [isAdmin, loading]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminUsers();
    }
  }, [isAdmin]);

  const fetchAdminUsers = async () => {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      if (roles && roles.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", roles.map(r => r.user_id));

        if (profilesError) throw profilesError;

        const combined = roles.map(role => ({
          ...role,
          profiles: profiles?.find(p => p.id === role.user_id) || { name: "", email: "" }
        }));

        setAdminUsers(combined);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newAdminEmail)
        .single();

      if (profileError) throw new Error("User not found");

      const { error } = await supabase.from("user_roles").insert({
        user_id: profile.id,
        role: "admin",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user added successfully",
      });

      setNewAdminEmail("");
      fetchAdminUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async (roleId: string) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user removed successfully",
      });

      fetchAdminUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, phone, credits, status, created_at");

      if (error) throw error;

      const csv = [
        ["Name", "Email", "Phone", "Credits", "Status", "Joined"],
        ...data.map((user) => [
          user.name,
          user.email,
          user.phone || "",
          user.credits,
          user.status,
          new Date(user.created_at).toLocaleDateString(),
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();

      toast({
        title: "Success",
        description: "User list exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Admin Users</CardTitle>
              <CardDescription>Add or remove admin access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="admin-email">User Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="user@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddAdmin} className="mt-6">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.profiles.name}</TableCell>
                          <TableCell>{admin.profiles.email}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveAdmin(admin.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Download user data as CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportUsers} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export User List to CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
