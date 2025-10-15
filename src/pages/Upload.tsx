import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload as UploadIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCredits } from "@/hooks/use-credits";
import modernFarmhouse from "@/assets/style-modern-farmhouse.jpg";
import coastal from "@/assets/style-coastal.jpg";
import scandinavian from "@/assets/style-scandinavian.jpg";
import contemporary from "@/assets/style-contemporary.jpg";
import midCentury from "@/assets/style-mid-century.jpg";
import mountainRustic from "@/assets/style-mountain-rustic.jpg";
import transitional from "@/assets/style-transitional.jpg";
import japandi from "@/assets/style-japandi.jpg";

const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [stagingStyle, setStagingStyle] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [stylesDialogOpen, setStylesDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const { credits } = useCredits(user);

  const styles = [
    { id: "modern-farmhouse", name: "Modern Farmhouse", image: modernFarmhouse, description: "Blend rustic charm with modern comfort" },
    { id: "coastal", name: "Coastal", image: coastal, description: "Relaxed beachside living with light colors" },
    { id: "scandinavian", name: "Scandinavian", image: scandinavian, description: "Minimalist Nordic design with clean lines" },
    { id: "contemporary", name: "Contemporary", image: contemporary, description: "Current trends with sleek sophistication" },
    { id: "mid-century-modern", name: "Mid-Century Modern", image: midCentury, description: "Retro 1950s-60s aesthetic" },
    { id: "mountain-rustic", name: "Mountain Rustic", image: mountainRustic, description: "Cozy cabin retreat atmosphere" },
    { id: "transitional", name: "Transitional", image: transitional, description: "Perfect balance of traditional and modern" },
    { id: "japandi", name: "Japandi", image: japandi, description: "Japanese and Scandinavian fusion" },
  ];

  const bundles = [
    { id: "single", name: "Single Photo", price: "$10", priceId: "price_1SD8lsIG3TLqP9yabBsx4jyZ", description: "Perfect for testing", photos: 1 },
    { id: "5-photos", name: "5 Photos", price: "$45", priceId: "price_1SD8nJIG3TLqP9yaGAjd2WdP", description: "$9 per photo", photos: 5 },
    { id: "10-photos", name: "10 Photos", price: "$85", priceId: "price_1SD8nNIG3TLqP9yazPngAINO", description: "$8.50 per photo", photos: 10 },
    { id: "20-photos", name: "20 Photos", price: "$160", priceId: "price_1SD8nQIG3TLqP9yaBVVV1coG", description: "$8 per photo", photos: 20 },
    { id: "50-photos", name: "50 Photos", price: "$375", priceId: "price_1SD8nTIG3TLqP9yaTOhRMNFq", description: "$7.50 per photo", photos: 50 },
    { id: "100-photos", name: "100 Photos", price: "$700", priceId: "price_1SD8nWIG3TLqP9yaH0D0oIpW", description: "$7 per photo", photos: 100 },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Please log in to upload photos");
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    // Get selected bundle from localStorage and find matching bundle by priceId
    const orderData = localStorage.getItem('orderContactInfo');
    if (orderData) {
      const parsedData = JSON.parse(orderData);
      if (parsedData.selectedBundle && parsedData.selectedBundle.priceId) {
        const matchingBundle = bundles.find(b => b.priceId === parsedData.selectedBundle.priceId);
        if (matchingBundle) {
          setSelectedBundle(matchingBundle.id);
        }
      }
    }
  }, []);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(
      (file) => file.type === "image/jpeg" || file.type === "image/png"
    );

    if (validFiles.length !== droppedFiles.length) {
      toast.error("Only JPEG and PNG files are allowed");
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);

      // Create previews
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
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

    if (!selectedBundle) {
      toast.error("Please select a bundle");
      return;
    }

    // Check if uploaded photos exceed selected bundle limit
    const bundle = bundles.find(b => b.id === selectedBundle);
    if (bundle && files.length > bundle.photos) {
      toast.error(`You have uploaded ${files.length} photos but selected the ${bundle.name} package. Please remove ${files.length - bundle.photos} photo${files.length - bundle.photos > 1 ? 's' : ''} or select a larger package.`);
      return;
    }

    setLoading(true);

    try {
      // Get contact info from localStorage (from place-order page)
      const contactInfo = JSON.parse(localStorage.getItem('orderContactInfo') || '{}');
      
      // Find the selected bundle
      const bundle = bundles.find(b => b.id === selectedBundle);
      if (!bundle) {
        throw new Error("Selected bundle not found");
      }

      // Upload files to storage first
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        return fileName;
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: bundle.priceId,
          contactInfo: contactInfo,
          files: uploadedFiles,
          stagingStyle: stagingStyle,
          photosCount: bundle.photos, // Send the number of credits to be added
        },
      });

      if (error) throw error;

      if (data?.url) {
        toast.success("Redirecting to payment...");
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to process checkout");
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
                {user && <span className="block mt-2 font-medium text-accent">Available Credits: {credits}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Property Photos (JPEG or PNG) <span className="text-destructive">*</span></Label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-smooth cursor-pointer ${
                      isDragOver 
                        ? 'border-accent bg-accent/10' 
                        : 'border-border hover:border-accent'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="staging-style">Staging Style <span className="text-destructive">*</span></Label>
                    <Dialog open={stylesDialogOpen} onOpenChange={setStylesDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-sm text-accent hover:underline font-medium"
                        >
                          Click Here to See Styles
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Available Staging Styles</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {styles.map((style) => (
                            <div
                              key={style.id}
                              className="rounded-xl overflow-hidden border border-border hover:border-accent transition-smooth cursor-pointer"
                              onClick={() => {
                                setStagingStyle(style.id);
                                setStylesDialogOpen(false);
                              }}
                            >
                              <img
                                src={style.image}
                                alt={style.name}
                                className="w-full h-48 object-cover"
                              />
                              <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2">{style.name}</h3>
                                <p className="text-sm text-muted-foreground">{style.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={stagingStyle} onValueChange={setStagingStyle} required>
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

                {/* Bundle Selection */}
                <div className="space-y-3">
                  <Label>Select Package <span className="text-destructive">*</span></Label>
                  <RadioGroup value={selectedBundle} onValueChange={setSelectedBundle}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bundles.map((bundle) => (
                        <div key={bundle.id} className="relative">
                          <RadioGroupItem
                            value={bundle.id}
                            id={bundle.id}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={bundle.id}
                            className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-smooth ${
                              selectedBundle === bundle.id
                                ? 'border-accent bg-accent/5'
                                : 'border-border hover:border-accent'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-lg">{bundle.name}</span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-smooth ${
                                selectedBundle === bundle.id
                                  ? 'border-accent bg-accent'
                                  : 'border-border'
                              }`}>
                                {selectedBundle === bundle.id && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                            </div>
                            <span className="text-2xl font-bold text-accent mb-1">{bundle.price}</span>
                            <span className="text-sm text-muted-foreground">{bundle.description}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                   </RadioGroup>
                   {selectedBundle && files.length > 0 && (() => {
                     const bundle = bundles.find(b => b.id === selectedBundle);
                     if (bundle && files.length > bundle.photos) {
                       return (
                         <div className="p-4 border-2 border-destructive/50 bg-destructive/10 rounded-xl">
                           <p className="text-sm text-destructive font-medium">
                             ⚠️ You have uploaded {files.length} photo{files.length > 1 ? 's' : ''} but selected the {bundle.name} package which allows only {bundle.photos} photo{bundle.photos > 1 ? 's' : ''}. 
                             Please remove {files.length - bundle.photos} photo{files.length - bundle.photos > 1 ? 's' : ''} or select a larger package.
                           </p>
                         </div>
                       );
                     }
                     return null;
                   })()}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                  disabled={loading || (() => {
                    const bundle = bundles.find(b => b.id === selectedBundle);
                    return bundle && files.length > bundle.photos;
                  })()}
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