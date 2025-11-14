import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Loader2, ArrowLeft, Upload as UploadIcon, X } from "lucide-react";

interface UploadedFile {
  path: string;
  url: string;
  name: string;
  size: number;
}

export default function PlaceOrderUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("Please sign in to place an order");
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      const contactData = sessionStorage.getItem('orderContactData');
      const style = sessionStorage.getItem('orderStyle');

      if (!contactData) {
        toast.error("Please complete contact information first");
        navigate('/place-order/contact');
        return;
      }

      if (!style) {
        toast.error("Please select a staging style first");
        navigate('/place-order/style');
        return;
      }

      const savedFiles = sessionStorage.getItem('orderUploadedFiles');
      if (savedFiles) {
        setUploadedFiles(JSON.parse(savedFiles));
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'image/jpeg' || file.type === 'image/png'
    );

    if (files.length === 0) {
      toast.error("Please drop JPEG or PNG images only");
      return;
    }

    await handleFiles(files);
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    await handleFiles(Array.from(files));
    e.target.value = '';
  };

  const handleFiles = async (files: File[]) => {
    if (!user) return;

    const orderId = sessionStorage.getItem('currentOrderId');
    if (!orderId) {
      toast.error('Order not found. Please start from the beginning.');
      navigate('/place-order/contact');
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    const maxFiles = 50;

    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed per order`);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 20MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    toast.info(`Uploading ${validFiles.length} image(s)...`);

    try {
      const newFiles: UploadedFile[] = [];

      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `originals/${user.id}/${orderId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('staging_original_photos')
          .insert({
            user_id: user.id,
            order_id: orderId,
            file_path: filePath,
            file_name: file.name
          });

        if (dbError) {
          console.error("Database error:", dbError);
          throw dbError;
        }

        newFiles.push({
          path: filePath,
          url: publicUrl,
          name: file.name,
          size: file.size
        });
      }

      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      sessionStorage.setItem('orderUploadedFiles', JSON.stringify(updatedFiles));
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (file: UploadedFile) => {
    try {
      const { error: dbError } = await supabase
        .from('staging_original_photos')
        .delete()
        .eq('file_path', file.path);

      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([file.path]);

      if (storageError) throw storageError;

      const updatedFiles = uploadedFiles.filter(f => f.path !== file.path);
      setUploadedFiles(updatedFiles);
      sessionStorage.setItem('orderUploadedFiles', JSON.stringify(updatedFiles));
      toast.success("Image removed");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to remove image");
    }
  };

  const handleSubmit = () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    navigate('/place-order/bundle');
  };

  const handleBack = () => {
    navigate('/place-order/style');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Upload Photos | ClickStage Pro"
        description="Upload your property photos for virtual staging"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Style Selection
          </Button>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Upload Property Photos</CardTitle>
              <CardDescription>
                Step 3 of 4 - Upload JPEG or PNG images (up to 20MB each)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <UploadIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drag and drop images here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload">
                    <Button asChild disabled={uploading} className="cursor-pointer">
                      <span>
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <UploadIcon className="w-4 h-4 mr-2" />
                            Choose Files
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-4">
                    Accepts JPEG and PNG files up to 20MB each
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">
                      Uploaded Images ({uploadedFiles.length})
                    </h3>
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(file)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  size="lg"
                  disabled={uploadedFiles.length === 0}
                >
                  Continue to Bundle Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
