import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Plus, Minus, Pause, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

interface ProfileWithCredits extends Profile {
  credits: number;
}

export default function AdminUsers() {
  const { isAdmin, loading, requireAdmin, shouldRenderAdmin } = useAdmin();
  const [users, setUsers] = useState<ProfileWithCredits[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ProfileWithCredits[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<ProfileWithCredits | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditAction, setCreditAction] = useState<"add" | "subtract">("add");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    requireAdmin();
  }, [isAdmin, loading]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch credits for each user from user_credits table
      const usersWithCredits: ProfileWithCredits[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: creditsData } = await supabase
            .from("user_credits")
            .select("credits")
            .eq("email", profile.email)
            .maybeSingle();
          
          return {
            ...profile,
            credits: creditsData?.credits || 0,
          };
        })
      );
      
      setUsers(usersWithCredits);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !creditAmount) return;

    const amount = parseInt(creditAmount);
    const finalAmount = creditAction === "subtract" ? -amount : amount;
    const newCredits = selectedUser.credits + finalAmount;

    if (newCredits < 0) {
      toast({
        title: "Invalid Amount",
        description: "Credits cannot be negative",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update credits in user_credits table
      const { error: updateError } = await supabase
        .from("user_credits")
        .upsert({ 
          email: selectedUser.email, 
          credits: newCredits 
        });

      if (updateError) throw updateError;

      const { error: txError } = await supabase.from("credits_transactions").insert({
        user_id: selectedUser.id,
        amount: finalAmount,
        transaction_type: "admin_adjustment",
        description: `Admin adjustment: ${creditAction === "add" ? "added" : "removed"} ${amount} credits`,
      });

      if (txError) throw txError;

      toast({
        title: "Success",
        description: "Credits updated successfully",
      });

      fetchUsers();
      setSelectedUser(null);
      setCreditAmount("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (user: Profile) => {
    const newStatus = user.status === "active" ? "paused" : "active";

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${newStatus === "active" ? "activated" : "paused"}`,
      });

      fetchUsers();
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

        <h1 className="text-3xl font-bold mb-6">User Management</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "N/A"}</TableCell>
                  <TableCell>{user.credits}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        View
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            Credits
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adjust Credits</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Current Credits: {selectedUser?.credits}</Label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant={creditAction === "add" ? "default" : "outline"}
                                onClick={() => setCreditAction("add")}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                              <Button
                                variant={creditAction === "subtract" ? "default" : "outline"}
                                onClick={() => setCreditAction("subtract")}
                              >
                                <Minus className="h-4 w-4 mr-1" />
                                Subtract
                              </Button>
                            </div>
                            <div>
                              <Label>Amount</Label>
                              <Input
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                placeholder="Enter amount"
                              />
                            </div>
                            <Button onClick={handleAdjustCredits} className="w-full">
                              Confirm
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
