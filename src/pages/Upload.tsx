import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [stagingStyle, setStagingStyle] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "image/jpeg" || file.type === "image/png"
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only JPEG and PNG files are allowed");
    }

    setFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!stagingStyle) {
      toast.error("Please select a staging style");
      return;
    }

    if (!user) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Upload files to storage
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from("uploads")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(fileName);

        // Create order record
        const { error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            original_image_url: urlData.publicUrl,
            staging_style: stagingStyle,
            status: "pending",
          });

        if (orderError) throw orderError;

        return data;
      });

      await Promise.all(uploadPromises);

      toast.success("Files uploaded successfully! Redirecting to payment...");
      
      // In a real implementation, this would redirect to Stripe checkout
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload files");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Upload Your Photos</CardTitle>
              <CardDescription>
                Upload property photos and select your preferred staging style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Property Photos (JPEG or PNG)</Label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-accent transition-smooth cursor-pointer">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        Drop files here or click to upload
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPEG and PNG up to 20MB each
                      </p>
                    </label>
                  </div>
                </div>

                {/* File Previews */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-smooth"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Staging Style */}
                <div className="space-y-2">
                  <Label htmlFor="staging-style">Staging Style</Label>
                  <Select value={stagingStyle} onValueChange={setStagingStyle}>
                    <SelectTrigger id="staging-style">
                      <SelectValue placeholder="Select a staging style" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      <SelectItem value="modern-farmhouse">Modern Farmhouse</SelectItem>
                      <SelectItem value="coastal">Coastal</SelectItem>
                      <SelectItem value="scandinavian">Scandinavian</SelectItem>
                      <SelectItem value="contemporary">Contemporary</SelectItem>
                      <SelectItem value="mid-century-modern">Mid-Century Modern</SelectItem>
                      <SelectItem value="shabby-chic">Shabby Chic</SelectItem>
                      <SelectItem value="mountain-rustic">Mountain Rustic</SelectItem>
                      <SelectItem value="transitional">Transitional</SelectItem>
                      <SelectItem value="japandi">Japandi</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Continue to Payment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Upload;