import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UploadedFile {
  path: string;
  url: string;
  name: string;
}

interface Step2UploadProps {
  initialPhotos?: UploadedFile[];
  onNext: (photos: UploadedFile[]) => void;
  onBack: () => void;
  userId: string;
}

export default function Step2Upload({ initialPhotos = [], onNext, onBack, userId }: Step2UploadProps) {
  const [photos, setPhotos] = useState<UploadedFile[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrl,
      name: file.name,
    };
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        toast.error(`${file.name} is not an image file`);
      }
      return isImage;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = validFiles.map(file => uploadFile(file));
      const uploadedFiles = await Promise.all(uploadPromises);

      setPhotos(prev => [...prev, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} photo(s) uploaded successfully`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload photos: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const removePhoto = async (photo: UploadedFile) => {
    try {
      const { error } = await supabase.storage
        .from('uploads')
        .remove([photo.path]);

      if (error) throw error;

      setPhotos(prev => prev.filter(p => p.path !== photo.path));
      toast.success("Photo removed");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to remove photo");
    }
  };

  const handleNext = () => {
    if (photos.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }
    onNext(photos);
  };

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-accent bg-accent/10"
            : "border-border hover:border-accent/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          disabled={uploading}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-accent/10 rounded-full">
            <Upload className="w-8 h-8 text-accent" />
          </div>

          <div>
            <p className="text-lg font-medium mb-2">
              {uploading ? "Uploading..." : "Drop photos here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: JPG, PNG, HEIC, WebP (max 20MB each)
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Select Photos
              </>
            )}
          </Button>
        </div>
      </div>

      {photos.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">
            Uploaded Photos ({photos.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.path}
                className="relative group rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                  {photo.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="text-center py-8">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No photos uploaded yet</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={uploading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="flex-1 bg-accent hover:bg-accent/90"
          disabled={uploading || photos.length === 0}
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
