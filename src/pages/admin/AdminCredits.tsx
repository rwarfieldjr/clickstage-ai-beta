import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Minus, Edit } from "lucide-react";

interface UserCredit {
  user_id: string;
  email: string;
  balance: number;
  name: string | null;
}

export default function AdminCredits() {
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from("credits_view")
        .select("*")
        .order("email");

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const adjustCredits = async (
    userId: string,
    email: string,
    type: "add" | "subtract" | "set",
    amount: number
  ) => {
    setProcessing(userId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let newBalance: number;
      let error: any;

      if (type === "add") {
        const result = await supabase.rpc("add_credits", {
          p_user_id: userId,
          p_amount: amount,
        });
        error = result.error;
        newBalance = result.data;
      } else if (type === "subtract") {
        const result = await supabase.rpc("subtract_credits", {
          p_user_id: userId,
          p_amount: amount,
        });
        error = result.error;
        newBalance = result.data;
      } else {
        const result = await supabase.rpc("set_credits", {
          p_user_id: userId,
          p_amount: amount,
        });
        error = result.error;
        newBalance = result.data;
      }

      if (error) throw error;

      await supabase.from("credit_history").insert({
        user_id: userId,
        admin_email: user.email,
        change_type: type,
        amount,
        new_balance: newBalance,
      });

      toast.success(`Credits ${type === "add" ? "added" : type === "subtract" ? "subtracted" : "set"} successfully`);
      await loadUsers();
    } catch (error) {
      console.error("Error adjusting credits:", error);
      toast.error("Failed to adjust credits");
    } finally {
      setProcessing(null);
    }
  };

  const handleSetCredits = (userId: string, email: string) => {
    const input = prompt("Set credits to:");
    if (input) {
      const amount = parseInt(input);
      if (!isNaN(amount) && amount >= 0) {
        adjustCredits(userId, email, "set", amount);
      } else {
        toast.error("Please enter a valid number");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Admin Credit Control</CardTitle>
          <CardDescription>
            Manage user credits across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-center p-4 font-semibold">Credits</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b hover:bg-muted/50">
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.name || "-"}</td>
                    <td className="p-4 text-center font-semibold">{user.balance}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustCredits(user.user_id, user.email, "add", 10)}
                          disabled={processing === user.user_id}
                        >
                          {processing === user.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              +10
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adjustCredits(user.user_id, user.email, "subtract", 10)}
                          disabled={processing === user.user_id}
                        >
                          {processing === user.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Minus className="w-4 h-4 mr-1" />
                              -10
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetCredits(user.user_id, user.email)}
                          disabled={processing === user.user_id}
                        >
                          {processing === user.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Edit className="w-4 h-4 mr-1" />
                              Set
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
