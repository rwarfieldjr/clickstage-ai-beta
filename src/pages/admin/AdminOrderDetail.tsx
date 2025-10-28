import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface OrderDetail {
  id: string;
  created_at: string;
  status: string;
  staging_style: string;
  original_image_url: string;
  staged_image_url: string | null;
  credits_used: number | null;
  user_id: string;
  profiles: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { isAdmin, loading, requireAdmin, shouldRenderAdmin } = useAdmin();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [signedOriginalUrl, setSignedOriginalUrl] = useState<string>("");
  const [signedStagedUrl, setSignedStagedUrl] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    requireAdmin();
  }, [isAdmin, loading]);

  useEffect(() => {
    if (isAdmin && id) {
      fetchOrder();
    }
  }, [isAdmin, id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles (
            name,
            email,
            phone
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);

      // Generate signed URLs for images
      if (data.original_image_url) {
        const originalPath = data.original_image_url.includes('storage/v1/object/public/')
          ? data.original_image_url.split('storage/v1/object/public/original-images/')[1]
          : data.original_image_url;
        
        if (originalPath) {
          const { data: signedData } = await supabase.storage
            .from('original-images')
            .createSignedUrl(originalPath, 3600);
          
          if (signedData?.signedUrl) {
            setSignedOriginalUrl(signedData.signedUrl);
          }
        }
      }

      if (data.staged_image_url) {
        const stagedPath = data.staged_image_url.includes('storage/v1/object/public/')
          ? data.staged_image_url.split('storage/v1/object/public/staged/')[1]
          : data.staged_image_url;
        
        if (stagedPath) {
          const { data: signedData } = await supabase.storage
            .from('staged')
            .createSignedUrl(stagedPath, 3600);
          
          if (signedData?.signedUrl) {
            setSignedStagedUrl(signedData.signedUrl);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin || !order) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Order Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{order.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Style</p>
                  <p className="font-medium capitalize">{order.staging_style}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Used</p>
                  <p className="font-medium">{order.credits_used || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.profiles.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm">{order.profiles.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{order.profiles.phone || "N/A"}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/admin/users/${order.user_id}`)}
              >
                View User Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              {signedOriginalUrl ? (
                <>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                    <img
                      src={signedOriginalUrl}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={signedOriginalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Full Size
                    </a>
                  </Button>
                </>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Loading image...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staged Image</CardTitle>
            </CardHeader>
            <CardContent>
              {signedStagedUrl ? (
                <>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                    <img
                      src={signedStagedUrl}
                      alt="Staged"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={signedStagedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Full Size
                    </a>
                  </Button>
                </>
              ) : order.staged_image_url ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Loading image...</p>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No staged image available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
