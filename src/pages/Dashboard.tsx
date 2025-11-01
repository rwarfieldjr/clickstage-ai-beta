import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { useCredits } from "@/hooks/use-credits";
import { Coins, CreditCard } from "lucide-react";
import { getDashboardTiers } from "@/config/pricing";
import { hasEnoughCredits } from "@/lib/credits";
import { handleCheckout } from "@/lib/checkout";
import { openSimpleCheckout } from "@/lib/simpleCheckout";

interface Order {
  id: string;
  original_image_url: string;
  staged_image_url: string | null;
  staging_style: string;
  status: string;
  created_at: string;
}

interface OrderWithSignedUrls extends Order {
  signedOriginalUrl?: string;
  signedStagedUrl?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState<OrderWithSignedUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { credits, refetchCredits } = useCredits(user);

  useEffect(() => {
    const verifyPayment = async (sessionId: string, userId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
        });

        if (error) throw error;

        if (data?.success) {
          toast.success(`Payment successful! ${data.credits} credits added to your account.`);
          await refetchCredits();
          await fetchOrders(userId);
          // Remove session_id from URL
          window.history.replaceState({}, '', '/dashboard');
        } else {
          toast.error("Payment verification failed. Please contact support.");
        }
      } catch (error: any) {
        console.error("Error verifying payment:", error);
        toast.error("Payment verification failed. Please contact support.");
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Check if returning from payment
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
          verifyPayment(sessionId, session.user.id);
        } else {
          fetchOrders(session.user.id);
        }
      }
    });
  }, [navigate, searchParams]);

  const fetchOrders = async (userId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Generate signed URLs for images
      const ordersWithSignedUrls = await Promise.all(
        (data || []).map(async (order) => {
          const orderWithUrls: OrderWithSignedUrls = { ...order };
          
          // Get signed URL for original image
          if (order.original_image_url) {
            // Extract the path from full URL or use as-is if it's just a path
            const originalPath = order.original_image_url.includes('storage/v1/object/public/')
              ? order.original_image_url.split('storage/v1/object/public/original-images/')[1]
              : order.original_image_url;
            
            if (originalPath) {
              const { data: signedData } = await supabase.storage
                .from('original-images')
                .createSignedUrl(originalPath, 3600); // 1 hour expiry
              
              if (signedData?.signedUrl) {
                orderWithUrls.signedOriginalUrl = signedData.signedUrl;
              }
            }
          }
          
          // Get signed URL for staged image
          if (order.staged_image_url) {
            const stagedPath = order.staged_image_url.includes('storage/v1/object/public/')
              ? order.staged_image_url.split('storage/v1/object/public/staged/')[1]
              : order.staged_image_url;
            
            if (stagedPath) {
              const { data: signedData } = await supabase.storage
                .from('staged')
                .createSignedUrl(stagedPath, 3600);
              
              if (signedData?.signedUrl) {
                orderWithUrls.signedStagedUrl = signedData.signedUrl;
              }
            }
          }
          
          return orderWithUrls;
        })
      );

      setOrders(ordersWithSignedUrls);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (priceId: string, credits: number, bundleName: string, bundlePrice: string) => {
    if (!user) return;

    try {
      toast.loading("Opening checkout...");
      await openSimpleCheckout(priceId);
    } catch (error: any) {
      toast.dismiss();
      
      // Log detailed error to console
      console.error("[Dashboard] Checkout error:", {
        error: error.message,
        priceId,
        bundleName,
        credits,
        stack: error.stack,
      });
      
      // Show user-friendly error with more details  
      const errorMessage = error.message || "Unknown error occurred";
      toast.error(`Checkout failed: ${errorMessage}. Please contact support if this persists.`);
    }
  };

  const creditBundles = getDashboardTiers();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          {/* Credits Card */}
          <Card className="shadow-custom-lg mb-6 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="text-xl">Available Credits</CardTitle>
              <CardDescription>
                Each credit allows you to stage one photo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent mb-4">{credits} Credits</div>
              <Button 
                onClick={() => document.getElementById('purchase-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-2"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Purchase More Credits
              </Button>
            </CardContent>
          </Card>

          {/* Purchase Credits Section */}
          <Card id="purchase-section" className="shadow-custom-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Purchase Credits
              </CardTitle>
              <CardDescription>Select a bundle to add more credits to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      >
                        Purchase
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Your Orders</CardTitle>
              <CardDescription>
                View and manage all your staging orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading orders...</p>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-lg text-destructive mb-4">
                    {error}
                  </p>
                  <button
                    onClick={() => user && fetchOrders(user.id)}
                    className="text-accent hover:underline font-medium"
                  >
                    Try again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    You don't have any orders yet
                  </p>
                  <a
                    href="/upload"
                    className="text-accent hover:underline font-medium"
                  >
                    Upload your first photo →
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Original</TableHead>
                        <TableHead>Staged</TableHead>
                        <TableHead>Style</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {order.signedOriginalUrl ? (
                              <img
                                src={order.signedOriginalUrl}
                                alt="Original"
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                                Loading...
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.signedStagedUrl ? (
                              <img
                                src={order.signedStagedUrl}
                                alt="Staged"
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : order.staged_image_url ? (
                              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                                Loading...
                              </div>
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                                Pending
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">
                            {order.staging_style}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "MMM dd, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;