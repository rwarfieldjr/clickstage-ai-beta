import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface OrderInfo {
  order_number: string;
  email: string;
  name: string;
  staging_style: string;
  status: string;
  created_at: string;
}

const AdminImages = () => {
  const { isAdmin, loading: adminLoading, requireAdmin, shouldRenderAdmin } = useAdmin();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchFiles();
    }
  }, [isAdmin]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from("original-images")
        .list("", {
          sortBy: { column: "created_at", order: "desc" },
        });

      if (storageError) throw storageError;

      // Recursively fetch files from all folders
      const allFiles: StorageFile[] = [];
      
      const fetchFolderContents = async (path: string = "") => {
        const { data, error } = await supabase
          .storage
          .from("original-images")
          .list(path, {
            sortBy: { column: "created_at", order: "desc" },
          });

        if (error) throw error;

        for (const item of data || []) {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          
          if (item.id === null) {
            // It's a folder, recurse into it
            await fetchFolderContents(fullPath);
          } else {
            // It's a file
            allFiles.push({
              ...item,
              name: fullPath,
            });
          }
        }
      };

      await fetchFolderContents();
      setFiles(allFiles);

      // Fetch order information for all files
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          order_number,
          original_image_url,
          staging_style,
          status,
          created_at,
          profiles:user_id (email, name)
        `);

      const ordersMap: Record<string, OrderInfo> = {};
      ordersData?.forEach((order: any) => {
        ordersMap[order.original_image_url] = {
          order_number: order.order_number,
          email: order.profiles?.email || "Unknown",
          name: order.profiles?.name || "Unknown",
          staging_style: order.staging_style,
          status: order.status,
          created_at: order.created_at,
        };
      });
      setOrders(ordersMap);

      // Generate signed URLs for all files
      const urlsMap: Record<string, string> = {};
      await Promise.all(
        allFiles.map(async (file) => {
          const { data } = await supabase
            .storage
            .from("original-images")
            .createSignedUrl(file.name, 3600);
          if (data?.signedUrl) {
            urlsMap[file.name] = data.signedUrl;
          }
        })
      );
      setSignedUrls(urlsMap);

    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    }
  };

  const downloadFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from("original-images")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from("original-images")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        toast.success("Opening file in new tab");
      }
    } catch (error) {
      console.error("Error getting signed URL:", error);
      toast.error("Failed to open file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (!shouldRenderAdmin) {
    return null;
  }

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Uploaded Images</h1>
          <p className="text-muted-foreground">View and download all uploaded customer images</p>
        </div>

        <div className="grid gap-4">
          {files.map((file) => {
            const orderInfo = orders[file.name];
            const signedUrl = signedUrls[file.name];
            
            return (
              <Card key={file.id} className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image Preview */}
                  {signedUrl && (
                    <div className="w-full md:w-48 h-48 flex-shrink-0">
                      <img 
                        src={signedUrl} 
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => getSignedUrl(file.name)}
                      />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium mb-1 text-lg">
                        {file.name.split('/').pop()}
                      </div>
                      {orderInfo && (
                        <div className="text-sm space-y-1 mb-3">
                          <div className="font-semibold text-base">{orderInfo.name}</div>
                          <div className="text-muted-foreground">{orderInfo.email}</div>
                          <div className="mt-2">
                            <span className="font-medium">Order:</span> {orderInfo.order_number}
                          </div>
                          <div>
                            <span className="font-medium">Style:</span> {orderInfo.staging_style}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {orderInfo.status}
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Size: {formatFileSize(file.metadata?.size || 0)}</div>
                        <div>Type: {file.metadata?.mimetype || "Unknown"}</div>
                        <div>Uploaded: {new Date(file.created_at).toLocaleString()}</div>
                        <div className="text-xs mt-1 opacity-70">Path: {file.name}</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadFile(file.name)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => getSignedUrl(file.name)}
                        variant="outline"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {files.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              No uploaded images found
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminImages;
