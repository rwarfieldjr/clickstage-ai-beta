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
import { Upload as UploadIcon, X, ZoomIn, Coins, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useCredits } from "@/hooks/use-credits";
import { useTheme } from "@/hooks/use-theme";
import { CreditsSummary } from "@/components/CreditsSummary";
import { handleCheckout } from "@/lib/checkout";
import { logEvent } from "@/lib/logEvent";
import { hasEnoughCredits, deductCredits, getCredits } from "@/lib/credits";
import { processCreditOrStripeCheckout } from "@/lib/creditCheckout";
import { PRICING_TIERS } from "@/config/pricing";
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
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "credits">("stripe");
  const [stagingNotes, setStagingNotes] = useState("");
  const [error, setError] = useState<string>("");
  const { credits, creditSummary, loading: creditsLoading, refetchCredits } = useCredits(user);
  const { theme } = useTheme();
  const [userCreditsBalance, setUserCreditsBalance] = useState<number>(0);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [propertyAddress, setPropertyAddress] = useState<string>("");

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

  const bundles = PRICING_TIERS.map(tier => ({
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

        // Fetch credits from user_credits table
        if (session.user.email) {
          const fetchedCredits = await getCredits(session.user.email);
          setUserCreditsBalance(fetchedCredits);
        }
      }
    });
  }, []);

  // ✅ Added Turnstile expiration + toast — stable patch (2025-11-04)
  // Manual expiration timer (4.5 min preemptive warning before Cloudflare's 5-min expiration)
  useEffect(() => {
    if (!turnstileToken) return;

    console.log("[TURNSTILE] Starting 4.5-minute expiration timer");
    const expirationTimer = setTimeout(() => {
      console.warn('[TURNSTILE] ⚠ Token expired (4.5-min timer), clearing...');
      setTurnstileToken('');
      toast.error("Verification expired — please click the box again.", {
        duration: 5000,
        style: {
          background: '#B71C1C',
          color: '#FFFFFF',
          border: '1px solid #FFCDD2',
        },
      });
    }, 270000); // 4.5 minutes

    return () => {
      clearTimeout(expirationTimer);
      console.log("[TURNSTILE] Expiration timer cleared");
    };
  }, [turnstileToken]);

  /**
   * ⚠️ PRODUCTION STABLE - DO NOT MODIFY WITHOUT REVIEW
   * @version 1.0.0-stable
   * @last-updated 2025-11-04
   * 
   * Turnstile widget initialization with full lifecycle management:
   * - Auto-refresh on token expiration (5-minute lifetime)
   * - Error handling with automatic retry
   * - Timeout detection
   * - Theme-aware rendering
   * - Proper cleanup on unmount
   * 
   * DO NOT REMOVE: expired-callback, error-callback, timeout-callback
   */
  // Initialize Turnstile widget with stability checks
  useEffect(() => {
    console.log("[STABILITY-CHECK] Initializing Turnstile widget");
    
    // Prevent multiple widget renders
    let widgetId: string | null = null;
    
    // Set up global callback for Turnstile
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
      console.log('[STABILITY-CHECK] ✓ Turnstile verification successful');
    };

    // Render Turnstile widget once the script is loaded
    const initTurnstile = () => {
      if ((window as any).turnstile && turnstileRef.current) {
        // Check if widget already exists
        const existingWidget = turnstileRef.current.querySelector('.cf-turnstile');
        if (existingWidget && existingWidget.hasChildNodes()) {
          console.log('[STABILITY-CHECK] ⚠ Turnstile widget already rendered, skipping');
          return;
        }

        // Clear any existing content
        turnstileRef.current.innerHTML = '';
        
        // Render new widget with expiration handling
        widgetId = (window as any).turnstile.render(turnstileRef.current, {
          sitekey: '0x4AAAAAAB9xdhqE9Qyud_D6',
          theme: theme === 'dark' ? 'dark' : 'light',
          callback: (token: string) => {
            setTurnstileToken(token);
            console.log('[STABILITY-CHECK] ✓ Turnstile token received', { tokenLength: token.length });
          },
          'error-callback': (error: string) => {
            console.error('[STABILITY-CHECK] ✗ Turnstile error:', error);
            setTurnstileToken(''); // Clear expired/invalid token
            toast.error("Security verification failed. Please try again or refresh the page.", {
              duration: 5000,
            });
          },
          'expired-callback': () => {
            console.warn('[STABILITY-CHECK] ⚠ Turnstile token expired (Cloudflare callback)');
            setTurnstileToken(''); // Clear expired token
            toast.error("Verification expired — please click the box again.", {
              duration: 5000,
              style: {
                background: '#B71C1C',
                color: '#FFFFFF',
                border: '1px solid #FFCDD2',
              },
            });
            // Auto-refresh the widget
            if (widgetId && (window as any).turnstile) {
              (window as any).turnstile.reset(widgetId);
            }
          },
          'timeout-callback': () => {
            console.error('[STABILITY-CHECK] ✗ Turnstile timeout');
            setTurnstileToken('');
            toast.error("Verification timed out. Please refresh the page and try again.", {
              duration: 5000,
            });
          },
        });
        
        console.log('[STABILITY-CHECK] ✓ Turnstile widget rendered with auto-refresh', { widgetId });
      }
    };

    // Wait for Turnstile script to load
    if ((window as any).turnstile) {
      initTurnstile();
    } else {
      console.log('[STABILITY-CHECK] Waiting for Turnstile script to load...');
      const checkTurnstile = setInterval(() => {
        if ((window as any).turnstile) {
          console.log('[STABILITY-CHECK] ✓ Turnstile script loaded');
          clearInterval(checkTurnstile);
          initTurnstile();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!(window as any).turnstile) {
          console.error('[STABILITY-CHECK] ✗ Turnstile script failed to load within 10s');
          clearInterval(checkTurnstile);
        }
      }, 10000);

      return () => clearInterval(checkTurnstile);
    }

    // Cleanup function
    return () => {
      if (widgetId && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetId);
          console.log('[STABILITY-CHECK] Turnstile widget cleaned up');
        } catch (e) {
          // Widget may already be removed
        }
      }
    };
  }, [theme]);

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

    // Stability check: Verify Turnstile token exists
    console.log("[STABILITY-CHECK] Checkout initiated");
    console.log("[STABILITY-CHECK] Turnstile token present:", !!turnstileToken);
    
    if (!turnstileToken) {
      console.error("[STABILITY-CHECK] ✗ Missing Turnstile token");
      toast.error("Security verification required. Please wait for the verification to complete or refresh the page.");
      
      // Try to reset the widget if it exists
      if ((window as any).turnstile && turnstileRef.current) {
        const widget = turnstileRef.current.querySelector('.cf-turnstile');
        if (widget) {
          console.log("[STABILITY-CHECK] Attempting to reset Turnstile widget");
          (window as any).turnstile.reset();
        }
      }
      return;
    }
    
    console.log("[STABILITY-CHECK] ✓ All pre-flight checks passed");

    // Log checkout event
    logEvent("checkout_clicked", { 
      time: Date.now(),
      fileCount: files.length,
      bundle: selectedBundle,
      style: stagingStyle,
      paymentMethod
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

    // Check if uploaded photos exceed selected bundle limit
    const bundle = bundles.find(b => b.id === selectedBundle);
    if (bundle && files.length > bundle.photos) {
      alert(`You have uploaded ${files.length} photos but selected the ${bundle.name} package. Please remove ${files.length - bundle.photos} photo${files.length - bundle.photos > 1 ? 's' : ''} or select a larger package.`);
      return;
    }

    // Check credits before processing if using credit payment
    if (paymentMethod === "credits" && user?.email) {
      const canProceed = await hasEnoughCredits(user.email, files.length);
      if (!canProceed) {
        alert("You do not have enough credits. Please purchase more photo packs.");
        return;
      }

      // REMOVED: Client-side credit deduction - now handled atomically on server
      // The process-credit-order edge function handles atomic credit deduction with proper locking
    }

    await handleCheckout({
      files,
      stagingStyle,
      selectedBundle,
      bundles,
      smsConsent,
      paymentMethod,
      stagingNotes,
      credits,
      user,
      userProfile,
      supabase,
      navigate,
      refetchCredits,
      setLoading,
      turnstileToken,
      propertyAddress,
    });
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
              {user && creditSummary && (
                <div className="mt-4">
                  <CreditsSummary summary={creditSummary} loading={creditsLoading} compact />
                </div>
              )}
              <div className="mt-6 bg-muted/50 p-4 rounded-lg">
                <h3 className="text-base font-semibold mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li><strong>Upload:</strong> Add your photos directly from your device or cloud storage.</li>
                  <li><strong>Select Style:</strong> Choose your preferred design look — Modern Farmhouse, Coastal, and more.</li>
                  <li><strong>Place Order:</strong> Confirm your bundle and complete checkout securely with Stripe.</li>
                  <li><strong>Receive Images:</strong> Get professionally staged photos within 24 hours, ready for MLS or marketing.</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  Not sure which bundle to choose? <Link to="/pricing" className="text-accent hover:underline font-medium">View pricing details</Link>.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {user && (
                <div className="text-right text-muted-foreground mb-3">
                  Remaining Credits: <strong className="text-foreground">{userCreditsBalance}</strong>
                </div>
              )}
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

                {/* Step 3: Payment Method */}
                {user && credits > 0 && (
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Step 3: Payment Method</Label>
                    <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "stripe" | "credits")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="stripe" className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Credit Card
                        </TabsTrigger>
                        <TabsTrigger value="credits" className="flex items-center gap-2">
                          <Coins className="w-4 h-4" />
                          Use Credits ({credits} available)
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                {/* Step 4: Select Bundle */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    {user && credits > 0 ? "Step 4:" : "Step 3:"} Select Bundle <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={selectedBundle} onValueChange={setSelectedBundle}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bundles.map((bundle) => {
                        const canAffordWithCredits = paymentMethod === "credits" && credits >= bundle.photos;
                        const isDisabled = paymentMethod === "credits" && !canAffordWithCredits;
                        
                        return (
                          <div key={bundle.id} className="relative">
                            <RadioGroupItem
                              value={bundle.id}
                              id={bundle.id}
                              className="peer sr-only"
                              disabled={isDisabled}
                            />
                            <label
                              htmlFor={bundle.id}
                              className={`flex flex-col p-4 border-2 rounded-xl transition-smooth ${
                                isDisabled 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'cursor-pointer hover:border-accent'
                              } ${
                                selectedBundle === bundle.id
                                  ? 'border-accent bg-accent/5'
                                  : 'border-border'
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
                              {paymentMethod === "credits" ? (
                                <>
                                  <span className="text-2xl font-bold text-accent mb-1">{bundle.photos} Credits</span>
                                  {!canAffordWithCredits && (
                                    <span className="text-xs text-destructive">Insufficient credits</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold text-accent mb-1">{bundle.price}</span>
                                  <span className="text-sm text-muted-foreground block mb-2">{bundle.description}</span>
                                </>
                              )}
                              <span className="text-xs text-muted-foreground mt-2">{bundle.expiration}</span>
                            </label>
                          </div>
                        );
                      })}
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

                {/* CAPTCHA Verification */}
                <div className="mb-4">
                  <Label className="text-base font-semibold mb-2 block">Security Verification <span className="text-destructive">*</span></Label>
                  <div ref={turnstileRef}></div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete the verification to proceed with your order.
                  </p>
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
                      // Validate Turnstile token
                      if (!turnstileToken) {
                        setError("Please complete the security verification.");
                        setLoading(false);
                        return;
                      }

                      if (files.length === 0) {
                        setError("Please upload at least one photo before continuing.");
                        return;
                      }
                      
                      const photoCount = files.length;
                      
                      // Check if user wants to use credits
                      if (user?.email) {
                        const result = await processCreditOrStripeCheckout(user.email, photoCount);
                        
                        if (result.method === "credits" && result.status === "success") {
                          toast.success(`Order placed successfully! ${photoCount} credits used.`);
                          await refetchCredits();
                          navigate('/dashboard');
                          return;
                        }
                        // If insufficient credits, continue to Stripe checkout below
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
                        credits,
                        user,
                        userProfile,
                        supabase,
                        navigate,
                        refetchCredits,
                        setLoading,
                        turnstileToken,
                        propertyAddress,
                      });
                      
                    } catch (err: any) {
                      console.error(err);
                      const errorMessage = err.message === "Insufficient credits" 
                        ? "Insufficient credits. Please purchase more credits to continue."
                        : err.message || "Something went wrong during checkout. Please try again.";
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