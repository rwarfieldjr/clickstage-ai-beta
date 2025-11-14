import Sidebar from "@/components/account/Sidebar";
import { useRequireUser } from "@/hooks/useRequireUser";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ShoppingCart, Loader2, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  balance_before: number | null;
  balance_after: number;
  created_at: string;
}

interface CreditData {
  credits: number;
  transactions: Transaction[];
}

export default function CreditsPage() {
  const { user, loading: userLoading } = useRequireUser();
  const [creditData, setCreditData] = useState<CreditData>({ credits: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadCredits = async (showRefreshToast = false) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_credits', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data) {
        setCreditData({
          credits: data.credits || 0,
          transactions: data.transactions || []
        });

        if (showRefreshToast) {
          toast.success("Credits refreshed");
        }
      }
    } catch (error: any) {
      console.error("Error loading credits:", error);
      toast.error("Failed to load credits");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCredits();
    }
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadCredits();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCredits(true);
  };

  const getTransactionBadge = (type: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      purchase: { variant: "default", label: "Purchase" },
      admin_add: { variant: "default", label: "Admin Added" },
      admin_subtract: { variant: "destructive", label: "Admin Removed" },
      deduction: { variant: "secondary", label: "Used" },
      refund: { variant: "default", label: "Refund" },
      expiration: { variant: "destructive", label: "Expired" },
    };

    const config = badges[type] || { variant: "outline", label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex gap-8 p-10 min-h-screen bg-secondary/30">
      <Sidebar />

      <div className="flex-1 space-y-6">
        {/* Credits Balance Card */}
        <Card className="shadow-custom-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-accent/10 rounded-full">
                  <CreditCard className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Your Credits</h1>
                  <p className="text-muted-foreground">Each credit stages one photo</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-accent/5 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Available Credits
                </p>
                <p className="text-5xl font-bold text-accent mb-2">
                  {creditData.credits}
                </p>
                <p className="text-sm text-muted-foreground">
                  {creditData.credits === 0
                    ? "Purchase credits to start staging"
                    : creditData.credits === 1
                    ? "1 photo staging available"
                    : `${creditData.credits} photo stagings available`}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => navigate("/pricing")}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Purchase More Credits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="shadow-custom-lg">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {creditData.transactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your credit history will appear here
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditData.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {format(new Date(transaction.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell>
                          {getTransactionBadge(transaction.transaction_type)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {transaction.amount > 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-green-600 font-semibold">
                                  +{transaction.amount}
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <span className="text-red-600 font-semibold">
                                  {transaction.amount}
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {transaction.balance_after}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How Credits Work */}
        <Card className="shadow-custom-lg">
          <CardHeader>
            <CardTitle>How Credits Work</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-accent font-bold text-lg">•</span>
                <span>Each credit allows you to stage one property photo</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-bold text-lg">•</span>
                <span>Credits are deducted when you place an order</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-bold text-lg">•</span>
                <span>All staged photos delivered within 24-48 hours</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-bold text-lg">•</span>
                <span>Professional, MLS-compliant results guaranteed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-bold text-lg">•</span>
                <span>Unlimited revisions until you're satisfied</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
