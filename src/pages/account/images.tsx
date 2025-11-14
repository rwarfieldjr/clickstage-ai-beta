import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/account/Sidebar";
import { useRequireUser } from "@/hooks/useRequireUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, Loader2, Upload, Edit2, X, Check, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface ImageFile {
  name: string;
  url: string;
  created_at: string;
  size: number;
  bucket: 'uploads' | 'staged';
}

export default function ImagesPage() {
  const { user, loading: userLoading } = useRequireUser();
  const [originalImages, setOriginalImages] = useState<ImageFile[]>([]);
  const [stagedImages, setStagedImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<'original' | 'staged' | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<ImageFile | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserImages();
    }
  }, [user]);

  const loadUserImages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setUserId(user.id);

      const [uploadsData, stagedData] = await Promise.all([
        supabase.storage.from('uploads').list(`${user.id}/`, { sortBy: { column: 'created_at', order: 'desc' } }),
        supabase.storage.from('staged').list(`${user.id}/`, { sortBy: { column: 'created_at', order: 'desc' } })
      ]);

      const uploadImages = await Promise.all(
        (uploadsData.data || [])
          .filter(file => {
            const size = file.metadata?.size || 0;
            if (size === 0) {
              console.warn(`Filtering out 0-byte file: ${file.name}`);
              return false;
            }
            return true;
          })
          .map(async (file) => {
            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(`${user.id}/${file.name}`);
            return {
              name: file.name,
              url: publicUrl,
              created_at: file.created_at || new Date().toISOString(),
              size: file.metadata?.size || 0,
              bucket: 'uploads' as const
            };
          })
      );

      const stagedImgs = await Promise.all(
        (stagedData.data || [])
          .filter(file => {
            const size = file.metadata?.size || 0;
            if (size === 0) {
              console.warn(`Filtering out 0-byte file: ${file.name}`);
              return false;
            }
            return true;
          })
          .map(async (file) => {
            const { data: { publicUrl } } = supabase.storage.from('staged').getPublicUrl(`${user.id}/${file.name}`);
            return {
              name: file.name,
              url: publicUrl,
              created_at: file.created_at || new Date().toISOString(),
              size: file.metadata?.size || 0,
              bucket: 'staged' as const
            };
          })
      );

      setOriginalImages(uploadImages);
      setStagedImages(stagedImgs);
    } catch (error: any) {
      console.error("Error loading images:", error);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent, type: 'original' | 'staged') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, bucket: 'uploads' | 'staged') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(null);

    if (!userId) return;

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));

    if (files.length === 0) {
      toast.error("Please drop image files only");
      return;
    }

    toast.info(`Uploading ${files.length} image(s)...`);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }
      }

      toast.success("Images uploaded successfully");
      await loadUserImages();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
    }
  }, [userId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, bucket: 'uploads' | 'staged') => {
    const files = e.target.files;
    if (!files || !userId) return;

    toast.info(`Uploading ${files.length} image(s)...`);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }
      }

      toast.success("Images uploaded successfully");
      await loadUserImages();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
    }

    e.target.value = '';
  };

  const handleDownload = async (image: ImageFile) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDownloadAllAsZip = async (images: ImageFile[], zipName: string) => {
    if (images.length === 0) {
      toast.error("No images to download");
      return;
    }

    setDownloadingZip(true);
    toast.info(`Preparing ${images.length} images for download...`);

    try {
      const zip = new JSZip();

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          zip.file(image.name, blob);

          if ((i + 1) % 5 === 0 || i === images.length - 1) {
            toast.info(`Processing ${i + 1}/${images.length} images...`);
          }
        } catch (error) {
          console.error(`Failed to fetch image ${image.name}:`, error);
        }
      }

      toast.info("Creating ZIP file...");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded ${images.length} images as ${zipName}`);
    } catch (error) {
      console.error("ZIP download error:", error);
      toast.error("Failed to create ZIP file");
    } finally {
      setDownloadingZip(false);
    }
  };

  const confirmDelete = async () => {
    if (!userId || !deleteConfirm) return;

    try {
      const { error } = await supabase.storage
        .from(deleteConfirm.bucket)
        .remove([`${userId}/${deleteConfirm.name}`]);

      if (error) throw error;

      toast.success("Image deleted");
      setDeleteConfirm(null);
      await loadUserImages();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleRename = async (image: ImageFile) => {
    if (!userId || !newName.trim()) return;

    const fileExt = image.name.split('.').pop();
    const sanitizedName = newName.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const finalName = `${sanitizedName}.${fileExt}`;

    try {
      const oldPath = `${userId}/${image.name}`;
      const newPath = `${userId}/${finalName}`;

      const { data: fileData, error: downloadError } = await supabase.storage
        .from(image.bucket)
        .download(oldPath);

      if (downloadError) throw downloadError;

      const { error: uploadError } = await supabase.storage
        .from(image.bucket)
        .upload(newPath, fileData, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: deleteError } = await supabase.storage
        .from(image.bucket)
        .remove([oldPath]);

      if (deleteError) throw deleteError;

      toast.success("Image renamed successfully");
      setEditingName(null);
      setNewName("");
      await loadUserImages();
    } catch (error: any) {
      console.error("Rename error:", error);
      toast.error(`Failed to rename image: ${error.message || 'Unknown error'}`);
    }
  };

  const startRename = (image: ImageFile) => {
    setEditingName(image.name);
    const nameWithoutExt = image.name.substring(0, image.name.lastIndexOf('.'));
    setNewName(nameWithoutExt);
  };

  const cancelRename = () => {
    setEditingName(null);
    setNewName("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderDropZone = (
    title: string,
    description: string,
    images: ImageFile[],
    bucket: 'uploads' | 'staged',
    inputId: string,
    showDownloadAll: boolean = false
  ) => (
    <Card className="border-gray-200 h-full bg-gray-50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-gray-900">{title}</CardTitle>
            <CardDescription className="text-gray-600">{description}</CardDescription>
          </div>
          {showDownloadAll && images.length > 0 && (
            <Button
              onClick={() => handleDownloadAllAsZip(images, `staged-photos-${Date.now()}.zip`)}
              disabled={downloadingZip}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {downloadingZip ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating ZIP...
                </>
              ) : (
                <>
                  <PackageOpen className="w-4 h-4 mr-2" />
                  Download All as ZIP
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => handleDragOver(e, bucket === 'uploads' ? 'original' : 'staged')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, bucket)}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragging === (bucket === 'uploads' ? 'original' : 'staged')
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-2">
            Drag and drop images here
          </p>
          <p className="text-xs text-gray-500 mb-4">or</p>
          <input
            id={inputId}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e, bucket)}
            className="hidden"
          />
          <label htmlFor={inputId}>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </span>
            </Button>
          </label>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No images yet. Drop or upload your first image.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {images.map((image) => (
                <Card key={image.name} className="overflow-hidden border-gray-200 bg-white">
                  <div className="flex gap-3 p-3">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingName === image.name ? (
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="New name"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(image);
                              if (e.key === 'Escape') cancelRename();
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleRename(image)} className="h-8 w-8 p-0">
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelRename} className="h-8 w-8 p-0">
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {image.name}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startRename(image)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mb-2">
                        {formatFileSize(image.size)} • {new Date(image.created_at).toLocaleDateString()}
                        {image.size === 0 && (
                          <span className="ml-2 text-red-600 font-semibold">⚠ Broken file</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        {image.size > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(image)}
                            className="h-7 text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm(image)}
                          className="h-7 text-xs"
                          title={image.size === 0 ? "Delete broken file" : "Delete image"}
                        >
                          <Trash2 className="w-3 h-3" />
                          {image.size === 0 ? "Remove" : ""}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex gap-8 p-10 min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 bg-white shadow-xl rounded-2xl p-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Image Portal</h1>
          <p className="text-gray-600">Upload, organize, and manage your original and staged photos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderDropZone(
          "Original Photos",
          "Upload your original listing photos here",
          originalImages,
          'uploads',
          'original-upload',
          false
        )}
        {renderDropZone(
          "Staged Photos",
          "Upload your AI-staged photos here",
          stagedImages,
          'staged',
          'staged-upload',
          true
        )}
      </div>

        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
