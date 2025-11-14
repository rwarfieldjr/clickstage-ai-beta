import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Minus, Edit2 } from "lucide-react";

interface UserCredit {
  id: string;
  email: string;
  credits: number;
  name: string | null;
}

export default function AdminCredits() {
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/admin");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      navigate("/admin");
      return;
    }

    await loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await supabase.rpc('admin_get_all_user_credits', {
        p_admin_id: user.id
      });

      if (result.error) throw result.error;

      if (result.data && result.data.users) {
        setUsers(result.data.users);
      }
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (userId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [userId]: value }));
  };

  const adjustCredits = async (userId: string, action: 'add' | 'subtract' | 'set') => {
    const inputValue = inputValues[userId];
    if (!inputValue || inputValue.trim() === '') {
      toast.error("Please enter a number");
      return;
    }

    const amount = parseInt(inputValue);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setProcessing(userId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let adjustAmount = amount;
      if (action === 'subtract') {
        adjustAmount = -amount;
      } else if (action === 'set') {
        const currentUser = users.find(u => u.id === userId);
        if (!currentUser) throw new Error("User not found");
        adjustAmount = amount - currentUser.credits;
      }

      const { data, error } = await supabase.rpc('admin_adjust_credits', {
        p_admin_id: user.id,
        p_user_id: userId,
        p_amount: adjustAmount,
        p_note: `Admin ${action}: ${amount} credits`
      });

      if (error) throw error;

      toast.success(`Credits ${action === 'add' ? 'added' : action === 'subtract' ? 'subtracted' : 'set'} successfully`);

      setInputValues(prev => ({ ...prev, [userId]: '' }));
      await loadUsers();
    } catch (error: any) {
      console.error("Error adjusting credits:", error);
      toast.error(error.message || "Failed to adjust credits");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="shadow-custom-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Admin Credit Control</CardTitle>
          <CardDescription>
            Manage user credits across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-center p-4 font-semibold">Credits</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">{user.name || "-"}</td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-lg text-accent">
                          {user.credits}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center items-center">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Amount"
                            value={inputValues[user.id] || ''}
                            onChange={(e) => handleInputChange(user.id, e.target.value)}
                            className="w-24 text-center"
                            disabled={processing === user.id}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustCredits(user.id, 'add')}
                            disabled={processing === user.id}
                            className="min-w-[80px]"
                          >
                            {processing === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustCredits(user.id, 'subtract')}
                            disabled={processing === user.id}
                            className="min-w-[100px]"
                          >
                            {processing === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Minus className="w-4 h-4 mr-1" />
                                Subtract
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustCredits(user.id, 'set')}
                            disabled={processing === user.id}
                            className="min-w-[70px]"
                          >
                            {processing === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Edit2 className="w-4 h-4 mr-1" />
                                Set
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
