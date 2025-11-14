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
import { getPricingTierById } from "@/config/pricing";

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
  const [photoLimit, setPhotoLimit] = useState<number>(100);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [attemptedUploadCount, setAttemptedUploadCount] = useState(0);
  const [existingCredits, setExistingCredits] = useState(0);

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', currentUser.id)
        .single();

      const userCredits = profile?.credits || 0;
      setExistingCredits(userCredits);

      const selectedBundleId = sessionStorage.getItem('orderBundle');
      const tier = selectedBundleId ? getPricingTierById(selectedBundleId) : null;
      const bundleCredits = tier?.credits || 0;

      const totalLimit = bundleCredits + userCredits;
      setPhotoLimit(totalLimit || 100);

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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [uploadedFiles, photoLimit, user]);

  const handleFiles = async (files: File[]) => {
    if (!user) return;

    const orderId = sessionStorage.getItem('currentOrderId');
    if (!orderId) {
      toast.error('Order not found. Please start from the beginning.');
      navigate('/place-order/contact');
      return;
    }

    const totalPhotos = uploadedFiles.length + files.length;

    if (totalPhotos > photoLimit) {
      setShowLimitModal(true);
      setAttemptedUploadCount(files.length);
      return;
    }

    const maxSize = 20 * 1024 * 1024;

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

    if (uploadedFiles.length > photoLimit) {
      toast.error("You have exceeded your photo limit. Please remove some photos or choose a larger bundle.");
      return;
    }

    navigate('/place-order/bundle');
  };

  const isOverLimit = uploadedFiles.length > photoLimit;

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
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                  }`}
                >
                  <UploadIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drag and drop images here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>

                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      className="bg-[#2F74FF] text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:opacity-90 transition"
                      onClick={() => document.getElementById("upload-multi-input")?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                          Uploading...
                        </>
                      ) : (
                        'Choose Files'
                      )}
                    </button>

                    <input
                      id="upload-multi-input"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFiles(Array.from(e.target.files));
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    Accepts JPEG and PNG files up to 20MB each
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        Uploaded Images ({uploadedFiles.length})
                      </h3>
                      <p className="text-sm text-gray-600">
                        {uploadedFiles.length} / {photoLimit} photos used
                      </p>
                    </div>
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

                <button
                  onClick={handleSubmit}
                  className="w-full bg-[#2F74FF] text-white font-semibold py-4 rounded-xl hover:bg-[#1F5BD4] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploadedFiles.length === 0 || isOverLimit}
                >
                  Continue to Bundle Selection
                </button>

                {isOverLimit && (
                  <p className="text-sm text-red-600 text-center">
                    You have exceeded your photo limit. Remove some photos or choose a larger bundle.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You Need a Larger Photo Bundle
            </h2>

            <p className="text-gray-700 mb-6">
              You selected a bundle with <strong>{photoLimit}</strong> credit{photoLimit !== 1 ? 's' : ''},
              but you're trying to upload <strong>{uploadedFiles.length + attemptedUploadCount}</strong> photos.
              Upgrade to a larger bundle or remove some photos to continue.
            </p>

            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                onClick={() => setShowLimitModal(false)}
              >
                Remove Photos
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/place-order/bundle')}
              >
                Choose Larger Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
