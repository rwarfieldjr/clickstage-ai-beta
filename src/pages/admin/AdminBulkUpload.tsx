import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

interface CSVRow {
  order_id?: string;
  order_number?: string;
  type: 'original' | 'staged';
  filename: string;
}

export default function AdminBulkUpload() {
  useRequireAdmin();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ total: 0, completed: 0, failed: 0 });

  const parseCSV = async (file: File): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
          
          const rows: CSVRow[] = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            return row;
          });
          
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const findOrderByIdentifier = async (orderId?: string, orderNumber?: string) => {
    if (orderId) {
      const { data } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('id', orderId)
        .single();
      return data;
    } else if (orderNumber) {
      const { data } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('order_number', orderNumber)
        .single();
      return data;
    }
    return null;
  };

  const uploadImageToStorage = async (
    file: File,
    orderId: string,
    userId: string,
    type: 'original' | 'staged'
  ) => {
    const fileExt = file.name.split('.').pop();
    const bucket = type === 'original' ? 'uploads' : 'staged';
    const fileName = `${userId}/${orderId}/${type}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const updateField = type === 'original' ? 'original_image_url' : 'staged_image_url';
    const { error: updateError } = await supabase
      .from('orders')
      .update({ [updateField]: publicUrl })
      .eq('id', orderId);

    if (updateError) throw updateError;
  };

  const handleCSVUpload = async () => {
    if (!csvFile || !imageFiles) {
      toast.error("Please select both CSV file and images");
      return;
    }

    setUploading(true);
    setProgress({ total: 0, completed: 0, failed: 0 });

    try {
      const rows = await parseCSV(csvFile);
      const imageMap = new Map<string, File>();
      
      Array.from(imageFiles).forEach(file => {
        imageMap.set(file.name, file);
      });

      setProgress({ total: rows.length, completed: 0, failed: 0 });

      for (const row of rows) {
        try {
          setProgress(prev => ({ ...prev, current: row.filename }));

          const order = await findOrderByIdentifier(row.order_id, row.order_number);
          if (!order) {
            throw new Error(`Order not found: ${row.order_id || row.order_number}`);
          }

          const imageFile = imageMap.get(row.filename);
          if (!imageFile) {
            throw new Error(`Image file not found: ${row.filename}`);
          }

          await uploadImageToStorage(imageFile, order.id, order.user_id, row.type);

          setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error: any) {
          console.error(`Failed to upload ${row.filename}:`, error);
          setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }

      toast.success(`Upload complete! ${progress.completed} succeeded, ${progress.failed} failed`);
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      toast.error("Failed to process bulk upload");
    } finally {
      setUploading(false);
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
          <Button variant="ghost" onClick={() => navigate("/admin/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Bulk Image Upload</h1>
        <p className="text-muted-foreground mb-6">
          Upload images for multiple orders at once using CSV mapping
        </p>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-1">
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  CSV-Based Bulk Upload
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with order mappings and select corresponding image files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>CSV Format Instructions</Label>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                    <p className="mb-2">CSV must include these columns:</p>
                    <p>order_id OR order_number, type, filename</p>
                    <p className="mt-2 text-muted-foreground">Example:</p>
                    <p>order_id,type,filename</p>
                    <p>abc-123,original,house1.jpg</p>
                    <p>def-456,staged,house2_staged.jpg</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV Mapping File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCSVFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-images">Image Files</Label>
                  <Input
                    id="bulk-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(e.target.files)}
                    disabled={uploading}
                  />
                  {imageFiles && (
                    <p className="text-sm text-muted-foreground">
                      {imageFiles.length} files selected
                    </p>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {progress.completed + progress.failed} / {progress.total}</span>
                      <span className="text-muted-foreground">
                        Success: {progress.completed} | Failed: {progress.failed}
                      </span>
                    </div>
                    <Progress 
                      value={((progress.completed + progress.failed) / progress.total) * 100} 
                    />
                    {progress.current && (
                      <p className="text-sm text-muted-foreground">
                        Processing: {progress.current}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleCSVUpload}
                  disabled={!csvFile || !imageFiles || uploading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Start Bulk Upload"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
