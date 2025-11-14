import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Download, Trash2, Loader2, Upload, Edit2, X, Check, Bell } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

interface ImageFile {
  name: string;
  url: string;
  created_at: string;
  size: number;
  bucket: 'uploads' | 'staged';
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

export default function AdminImagesNew() {
  const { isAdmin, isLoading } = useRequireAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [originalImages, setOriginalImages] = useState<ImageFile[]>([]);
  const [stagedImages, setStagedImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState<'original' | 'staged' | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<ImageFile | null>(null);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      loadUsers();
    }
  }, [isAdmin, isLoading]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserImages(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('email', { ascending: true });

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  const loadUserImages = async (userId: string) => {
    try {
      setLoading(true);

      const user = users.find(u => u.id === userId);
      setSelectedUser(user || null);

      const [uploadsData, stagedData] = await Promise.all([
        supabase.storage.from('uploads').list(`${userId}/`, { sortBy: { column: 'created_at', order: 'desc' } }),
        supabase.storage.from('staged').list(`${userId}/`, { sortBy: { column: 'created_at', order: 'desc' } })
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
            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(`${userId}/${file.name}`);
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
            const { data: { publicUrl } } = supabase.storage.from('staged').getPublicUrl(`${userId}/${file.name}`);
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

    if (!selectedUserId) return;

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
        const filePath = `${selectedUserId}/${fileName}`;

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
      await loadUserImages(selectedUserId);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
    }
  }, [selectedUserId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, bucket: 'uploads' | 'staged') => {
    const files = e.target.files;
    if (!files || !selectedUserId) return;

    toast.info(`Uploading ${files.length} image(s)...`);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${selectedUserId}/${fileName}`;

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
      await loadUserImages(selectedUserId);
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

  const confirmDelete = async () => {
    if (!selectedUserId || !deleteConfirm) return;

    try {
      const { error } = await supabase.storage
        .from(deleteConfirm.bucket)
        .remove([`${selectedUserId}/${deleteConfirm.name}`]);

      if (error) throw error;

      toast.success("Image deleted");
      setDeleteConfirm(null);
      await loadUserImages(selectedUserId);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleRename = async (image: ImageFile) => {
    if (!selectedUserId || !newName.trim()) return;

    const fileExt = image.name.split('.').pop();
    const sanitizedName = newName.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const finalName = `${sanitizedName}.${fileExt}`;

    try {
      const oldPath = `${selectedUserId}/${image.name}`;
      const newPath = `${selectedUserId}/${finalName}`;

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
      await loadUserImages(selectedUserId);
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

  const handleNotifyComplete = async () => {
    if (!selectedUser) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Admin session expired');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-staging-complete-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          email: selectedUser.email,
          name: selectedUser.name || 'Customer',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      toast.success(`Notification sent to ${selectedUser.email}`);
      setShowNotifyDialog(false);
    } catch (error: any) {
      console.error("Notify error:", error);
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
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
    inputId: string
  ) => (
    <Card className="border-gray-200 h-full bg-gray-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-900">{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
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
            disabled={!selectedUserId}
          />
          <label htmlFor={inputId}>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedUserId}>
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
              {selectedUserId ? "No images yet. Drop or upload images." : "Select a user to view images"}
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
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(image)}
                          className="h-7 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm(image)}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
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

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Admin Image Portal - ClickStage Pro"
        description="Manage and organize all client photos"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Admin Image Portal
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Manage and organize all client originals and staged photos
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <CardTitle className="mb-4">Select User</CardTitle>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedUser && (
                    <Button
                      onClick={() => setShowNotifyDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Alert Customer of Completed Order
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {selectedUserId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderDropZone(
                  "Original Photos",
                  "Original listing photos from customer",
                  originalImages,
                  'uploads',
                  'original-upload'
                )}
                {renderDropZone(
                  "Staged Photos",
                  "AI-staged photos ready for delivery",
                  stagedImages,
                  'staged',
                  'staged-upload'
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

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

      <AlertDialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Completion Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to alert <strong>{selectedUser?.email}</strong> that their staging order is complete?
              They will receive an email with a link to view their photos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNotifyComplete}
              className="bg-green-600 hover:bg-green-700"
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Yes, Send Email"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
