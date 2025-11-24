// @version: stable-1.0 | Do not auto-modify | Last updated by Rob Warfield

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, X, ZoomIn, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useTheme } from "@/hooks/use-theme";
import { handleCheckout } from "@/lib/checkout";
import { logEvent } from "@/lib/logEvent";
import { PRICING_TIERS } from "@/config/pricing";
import { ENV } from "@/config/environment";
import modernFarmhouse from "@/assets/style-modern-farmhouse.jpg";
import coastal from "@/assets/style-coastal.jpg";
import scandinavian from "@/assets/style-scandinavian.jpg";
import contemporary from "@/assets/style-contemporary.jpg";
import midCentury from "@/assets/style-mid-century.jpg";
import transitional from "@/assets/style-transitional.jpg";
import japandi from "@/assets/style-japandi.jpg";

const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [stagingStyle, setStagingStyle] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [stylesDialogOpen, setStylesDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [magnifiedImage, setMagnifiedImage] = useState<{ name: string; image: string } | null>(null);
  const [smsConsent, setSmsConsent] = useState(false);
  const [stagingNotes, setStagingNotes] = useState("");
  const [error, setError] = useState<string>("");
  const { theme } = useTheme();
  const [propertyAddress, setPropertyAddress] = useState<string>("");
  const [photoQuantity, setPhotoQuantity] = useState<number>(1);
  const [twilightPhotoCount, setTwilightPhotoCount] = useState<number>(0);
  const [declutterRoomCount, setDeclutterRoomCount] = useState<number>(0);
  const [rushOrder, setRushOrder] = useState(false);

  const styles = [
    { id: "modern-farmhouse", name: "Modern Farmhouse", image: modernFarmhouse, description: "Blend rustic charm with modern comfort" },
    { id: "coastal", name: "Coastal", image: coastal, description: "Relaxed beachside living with light colors" },
    { id: "scandinavian", name: "Scandinavian", image: scandinavian, description: "Minimalist Nordic design with clean lines" },
    { id: "contemporary", name: "Contemporary", image: contemporary, description: "Current trends with sleek sophistication" },
    { id: "mid-century-modern", name: "Mid-Century Modern", image: midCentury, description: "Retro 1950s-60s aesthetic" },
    { id: "transitional", name: "Transitional", image: transitional, description: "Perfect balance of traditional and modern" },
    { id: "japandi", name: "Japandi", image: japandi, description: "Japanese and Scandinavian fusion" },
  ];

  // Only show the $10 single photo credit option
  const bundles = PRICING_TIERS.filter(tier => tier.id === "single").map(tier => ({
    id: tier.id,
    name: tier.displayName,
    price: tier.price,
    priceId: tier.priceId,
    description: tier.perPhoto,
    photos: tier.credits,
    expiration: tier.expiration,
    checkoutUrl: tier.checkoutUrl
  }));

  useEffect(() => {
    // Check for selected bundle from localStorage (from place-order page OR account settings)
    const bundleData = localStorage.getItem('selectedBundle');
    const orderData = localStorage.getItem('orderContactInfo');
    
    if (bundleData) {
      const parsedBundle = JSON.parse(bundleData);
      const matchingBundle = bundles.find(b => b.priceId === parsedBundle.priceId);
      if (matchingBundle) {
        setSelectedBundle(matchingBundle.id);
      }
    } else if (orderData) {
      const parsedData = JSON.parse(orderData);
      if (parsedData.selectedBundle && parsedData.selectedBundle.priceId) {
        const matchingBundle = bundles.find(b => b.priceId === parsedData.selectedBundle.priceId);
        if (matchingBundle) {
          setSelectedBundle(matchingBundle.id);
        }
      }
    }

    // Load property address from contact info
    if (orderData) {
      const parsedData = JSON.parse(orderData);
      if (parsedData.propertyAddress) {
        setPropertyAddress(parsedData.propertyAddress);
      }
    }

    // Load user session and profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        
        // Load user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profileData) {
          setUserProfile(profileData);
        }
      }
    });
  }, []);

  // Auto-sync photo quantity with uploaded files count
  useEffect(() => {
    if (files.length > 0) {
      setPhotoQuantity(files.length);
    }
  }, [files.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp"
    );

    // Check file size (10MB max)
    const MAX_SIZE_MB = 10;
    const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const oversizedFiles = validFiles.filter(file => file.size > MAX_BYTES);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(", ");
      toast.error(`File(s) too large: ${fileNames}. Maximum size is ${MAX_SIZE_MB}MB per file.`);
      return;
    }

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only JPEG, PNG, and WEBP images are allowed");
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
      (file) => file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp"
    );

    // Check file size (10MB max)
    const MAX_SIZE_MB = 10;
    const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
    const oversizedFiles = validFiles.filter(file => file.size > MAX_BYTES);

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(", ");
      toast.error(`File(s) too large: ${fileNames}. Maximum size is ${MAX_SIZE_MB}MB per file.`);
      return;
    }

    if (validFiles.length !== droppedFiles.length) {
      toast.error("Only JPEG, PNG, and WEBP images are allowed");
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

    // Log checkout event
    logEvent("checkout_clicked", { 
      time: Date.now(),
      fileCount: files.length,
      bundle: selectedBundle,
      style: stagingStyle,
    });

    // JavaScript validation with alerts
    if (!smsConsent) {
      alert("Please agree to receive SMS messages by checking the consent box.");
      return;
    }

    if (files.length === 0) {
      alert("Please upload at least one photo before continuing.");
      return;
    }

    if (!stagingStyle) {
      alert("Please select a staging style from the dropdown.");
      return;
    }

    if (!selectedBundle) {
      alert("Please select a bundle package.");
      return;
    }

    if (!propertyAddress.trim()) {
      alert("Please enter the property address.");
      return;
    }

    // Check if uploaded photos exceed selected quantity
    if (files.length > photoQuantity) {
      alert(`You have uploaded ${files.length} photos but selected ${photoQuantity} photo${photoQuantity > 1 ? 's' : ''}. Please remove ${files.length - photoQuantity} photo${files.length - photoQuantity > 1 ? 's' : ''} or increase the quantity.`);
      return;
    }

    try {
      await handleCheckout({
        files,
        stagingStyle,
        selectedBundle,
        bundles,
        smsConsent,
        paymentMethod: "stripe",
        stagingNotes,
        credits: 0,
        user,
        userProfile,
        supabase,
        navigate,
        refetchCredits: async () => {},
        setLoading,
        propertyAddress,
        photoQuantity, // Pass the quantity
        twilightPhotoCount,
        declutterRoomCount,
        rushOrder,
      });
    } catch (error) {
      throw error; // Re-throw to let handleCheckout's error handling work
    }
  };

  return (
    <Layout>
      <SEO 
        title="Upload Photos | Virtual Staging Order"
        description="Upload your property photos to start an AI virtual staging order with ClickStagePro. Fast, affordable, and MLS-compliant results delivered within 24 hours."
        canonical="/upload"
        keywords="upload virtual staging photos, AI virtual staging order, real estate photo upload, MLS compliant virtual staging, ClickStagePro order"
      />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto shadow-custom-lg">
            <CardHeader>
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 overflow-x-auto">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    ✓
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">Contact Info</span>
                </div>
                <div className="w-6 sm:w-12 h-0.5 bg-border shrink-0"></div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    2
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-accent whitespace-nowrap">Upload Photos</span>
                </div>
                <div className="w-6 sm:w-12 h-0.5 bg-border shrink-0"></div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    3
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Payment</span>
                </div>
              </div>

              <CardTitle className="text-2xl md:text-3xl">Upload Your Photos</CardTitle>
              <CardDescription className="text-base md:text-lg mt-2">
                Start your AI virtual staging order in minutes. Simply upload your property photos, choose your bundle, and select your design style. We'll deliver photorealistic, MLS-compliant staged images within 24 hours.
              </CardDescription>
              <div className="mt-6 bg-muted/50 p-4 rounded-lg">
                <h3 className="text-base font-semibold mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li><strong>Upload:</strong> Add your photos directly from your device or cloud storage.</li>
                  <li><strong>Select Style:</strong> Choose your preferred design look — Modern Farmhouse, Coastal, and more.</li>
                  <li><strong>Place Order:</strong> Confirm your bundle and complete checkout securely with Stripe.</li>
                  <li><strong>Receive Images:</strong> Get professionally staged photos within 24 hours, ready for MLS or marketing.</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  Not sure which bundle to choose? <Link to="/pricing" className="text-accent hover:underline font-medium">Start my order</Link>.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Property Address */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                  <Label htmlFor="property-address" className="text-base font-semibold">
                    Address of Property to Be Staged <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="property-address"
                    type="text"
                    placeholder="123 Main St, City, State ZIP"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="bg-background"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This helps us organize and deliver your staged photos correctly.
                  </p>
                </div>

                {/* Step 1: Staging Style */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="staging-style" className="text-lg font-semibold">Step 1: Staging Style <span className="text-destructive">*</span></Label>
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
                              className="rounded-xl overflow-hidden border border-border hover:border-accent transition-smooth"
                            >
                              <div 
                                className="relative cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMagnifiedImage({ name: style.name, image: style.image });
                                }}
                              >
                                <img
                                  src={style.image}
                                  alt={style.name}
                                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                                    <ZoomIn className="w-6 h-6 text-accent" />
                                  </div>
                                </div>
                              </div>
                              <div 
                                className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                                onClick={() => {
                                  setStagingStyle(style.id);
                                  setStylesDialogOpen(false);
                                }}
                              >
                                <h3 className="text-lg font-semibold mb-2">{style.name}</h3>
                                <p className="text-sm text-muted-foreground">{style.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                      <SelectItem value="mountain-rustic">Mountain Rustic</SelectItem>
                      <SelectItem value="transitional">Transitional</SelectItem>
                      <SelectItem value="japandi">Japandi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: File Upload */}
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">Step 2: Property Photos (JPEG or PNG) <span className="text-destructive">*</span></Label>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Uploaded Photos</Label>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full">
                        <span className="text-sm font-medium">{files.length} photo{files.length !== 1 ? 's' : ''} uploaded</span>
                      </div>
                    </div>
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
                  </div>
                )}

                {/* Step 3: Select Bundle */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Step 3: Select Bundle <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={selectedBundle} onValueChange={setSelectedBundle}>
                    <div className="grid grid-cols-1 gap-4 max-w-xl">
                      {bundles.map((bundle) => {
                        const twilightCost = twilightPhotoCount * 5;
                        const declutterCost = declutterRoomCount * 5;
                        const rushCost = rushOrder ? photoQuantity * 5 : 0;
                        const addOnCost = twilightCost + declutterCost + rushCost;
                        const totalCost = (10 * photoQuantity) + addOnCost;
                        
                        return (
                          <div key={bundle.id} className="relative">
                            <RadioGroupItem
                              value={bundle.id}
                              id={bundle.id}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={bundle.id}
                              className={`flex flex-col p-6 border-2 rounded-xl transition-smooth cursor-pointer hover:border-accent ${
                                selectedBundle === bundle.id
                                  ? 'border-accent bg-accent/5'
                                  : 'border-border'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <span className="font-semibold text-xl">Single Photo</span>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-smooth ${
                                  selectedBundle === bundle.id
                                    ? 'border-accent bg-accent'
                                    : 'border-border'
                                }`}>
                                  {selectedBundle === bundle.id && (
                                    <div className="w-3 h-3 rounded-full bg-white" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Quantity Selector */}
                              <div className="mb-4 space-y-2">
                                <Label className="text-sm font-medium">Number of Photos</Label>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPhotoQuantity(Math.max(1, photoQuantity - 1));
                                    }}
                                    disabled={photoQuantity <= 1}
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={photoQuantity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (!isNaN(val) && val >= 1 && val <= 100) {
                                        setPhotoQuantity(val);
                                      }
                                    }}
                                    className="text-center h-10 w-20"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPhotoQuantity(Math.min(100, photoQuantity + 1));
                                    }}
                                    disabled={photoQuantity >= 100}
                                  >
                                    +
                                  </Button>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    photos × $10 each
                                  </span>
                                </div>
                              </div>
                              
                              <span className="text-3xl font-bold text-accent mb-1">${totalCost}</span>
                              <span className="text-sm text-muted-foreground block mb-2">
                                ${10 * photoQuantity} for {photoQuantity} photo{photoQuantity > 1 ? 's' : ''}
                                {addOnCost > 0 && <span> + ${addOnCost} add-ons</span>}
                              </span>
                              
                              {/* Add-on Options */}
                              <div className="mt-4 pt-4 border-t border-border space-y-4">
                                <p className="text-sm font-medium mb-2">Optional Add-ons:</p>
                                
                                {/* Twilight Photo with Quantity */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                      Twilight Photo (front of property) - $5 per photo
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTwilightPhotoCount(Math.max(0, twilightPhotoCount - 1));
                                      }}
                                      disabled={twilightPhotoCount <= 0}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={photoQuantity}
                                      value={twilightPhotoCount}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= photoQuantity) {
                                          setTwilightPhotoCount(val);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-center h-8 w-16"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTwilightPhotoCount(Math.min(photoQuantity, twilightPhotoCount + 1));
                                      }}
                                      disabled={twilightPhotoCount >= photoQuantity}
                                    >
                                      +
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                      {twilightPhotoCount > 0 ? `${twilightPhotoCount} photo${twilightPhotoCount > 1 ? 's' : ''} × $5 = $${twilightPhotoCount * 5}` : 'None selected'}
                                    </span>
                                  </div>
                                </div>

                                {/* Declutter Room with Quantity */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                      Declutter Room - $5 per room (specify rooms in Notes to Staging Team)
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeclutterRoomCount(Math.max(0, declutterRoomCount - 1));
                                      }}
                                      disabled={declutterRoomCount <= 0}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={photoQuantity}
                                      value={declutterRoomCount}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= photoQuantity) {
                                          setDeclutterRoomCount(val);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-center h-8 w-16"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeclutterRoomCount(Math.min(photoQuantity, declutterRoomCount + 1));
                                      }}
                                      disabled={declutterRoomCount >= photoQuantity}
                                    >
                                      +
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                      {declutterRoomCount > 0 ? `${declutterRoomCount} room${declutterRoomCount > 1 ? 's' : ''} × $5 = $${declutterRoomCount * 5}` : 'None selected'}
                                    </span>
                                  </div>
                                </div>

                                {/* Rush Order Checkbox */}
                                <div className="flex items-start space-x-3">
                                  <Checkbox 
                                    id={`rush-${bundle.id}`}
                                    checked={rushOrder}
                                    onCheckedChange={(checked) => setRushOrder(checked as boolean)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <label
                                    htmlFor={`rush-${bundle.id}`}
                                    className="text-sm leading-tight cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Rush Order (need in less than 24hrs - specify return time needed in Notes to Staging Team - 2hrs minimum lead time) - $5 per photo
                                  </label>
                                </div>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                   </RadioGroup>
                   {selectedBundle && files.length > 0 && photoQuantity && files.length !== photoQuantity && (
                     <div className="p-4 border-2 border-destructive/50 bg-destructive/10 rounded-xl">
                       <p className="text-sm text-destructive font-medium">
                         {files.length > photoQuantity ? (
                           <>
                             ⚠️ You have uploaded {files.length} photo{files.length > 1 ? 's' : ''} but selected {photoQuantity} photo{photoQuantity > 1 ? 's' : ''}. 
                             Please remove {files.length - photoQuantity} photo{files.length - photoQuantity > 1 ? 's' : ''} or increase the quantity.
                           </>
                         ) : (
                           <>
                             ⚠️ You have selected {photoQuantity} photo{photoQuantity > 1 ? 's' : ''} but only uploaded {files.length} photo{files.length > 1 ? 's' : ''}. 
                             Please upload {photoQuantity - files.length} more photo{photoQuantity - files.length > 1 ? 's' : ''} or decrease the quantity.
                           </>
                         )}
                       </p>
                     </div>
                   )}
                </div>

                {/* Notes for Staging Team */}
                <div className="space-y-3">
                  <Label htmlFor="staging-notes" className="text-lg font-semibold">
                    Notes for the Staging Team
                  </Label>
                  <Textarea
                    id="staging-notes"
                    placeholder="Add any special instructions or preferences for the staging team (optional)..."
                    value={stagingNotes}
                    onChange={(e) => setStagingNotes(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {stagingNotes.length}/500 characters
                  </p>
                </div>

                {/* SMS Consent Checkbox */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="sms-consent"
                    checked={smsConsent}
                    onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="sms-consent"
                      className="text-sm leading-relaxed cursor-pointer text-muted-foreground"
                    >
                      By checking this box, you agree to receive text messages from{' '}
                      <strong className="text-foreground">ClickStagePro</strong> related to your order, 
                      account updates, and occasional offers. Message & data rates may apply. 
                      Reply <strong className="text-foreground">STOP</strong> to opt out or{' '}
                      <strong className="text-foreground">HELP</strong> for help. See our{' '}
                      <Link 
                        to="/sms-policy" 
                        target="_blank"
                        className="text-accent hover:underline"
                      >
                        SMS Messaging Policy
                      </Link>.
                    </label>
                  </div>
                </div>

                {/* Status feedback */}
                <div className="min-h-[24px] mb-2">
                  {loading && (
                    <div className="text-blue-600 text-sm font-medium animate-pulse">
                      Processing your order…
                    </div>
                  )}
                  {error && (
                    <div className="text-red-600 text-sm font-medium">
                      {error}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError("");
                    
                    try {
                      if (files.length === 0) {
                        setError("Please upload at least one photo before continuing.");
                        return;
                      }
                      
                      if (files.length !== photoQuantity) {
                        if (files.length > photoQuantity) {
                          setError(`You have uploaded ${files.length} photo${files.length > 1 ? 's' : ''} but selected ${photoQuantity} photo${photoQuantity > 1 ? 's' : ''}. Please remove ${files.length - photoQuantity} photo${files.length - photoQuantity > 1 ? 's' : ''} or increase the quantity.`);
                        } else {
                          setError(`You have selected ${photoQuantity} photo${photoQuantity > 1 ? 's' : ''} but only uploaded ${files.length} photo${files.length > 1 ? 's' : ''}. Please upload ${photoQuantity - files.length} more photo${photoQuantity - files.length > 1 ? 's' : ''} or decrease the quantity.`);
                        }
                        toast.error("Photo count mismatch. Please adjust your uploads or quantity.");
                        return;
                      }
                      
                      
                      // Proceed with Stripe checkout using handleCheckout
                      await handleCheckout({
                        files,
                        stagingStyle,
                        selectedBundle,
                        bundles,
                        smsConsent,
                        paymentMethod: "stripe",
                        stagingNotes,
                        credits: 0,
                        user,
                        userProfile,
                        supabase,
                        navigate,
                        refetchCredits: async () => {},
                        setLoading,
                        propertyAddress,
                        photoQuantity, // Pass the quantity
                        twilightPhotoCount,
                        declutterRoomCount,
                        rushOrder,
                      });
                      
                    } catch (err: any) {
                      console.error(err);
                      const errorMessage = err.message || "Something went wrong during checkout. Please try again.";
                      setError(errorMessage);
                      toast.error(errorMessage);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Proceed to Checkout"}
                </button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Magnified Image Dialog */}
      <Dialog open={!!magnifiedImage} onOpenChange={() => setMagnifiedImage(null)}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl">{magnifiedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            <img
              src={magnifiedImage?.image}
              alt={magnifiedImage?.name}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Upload;