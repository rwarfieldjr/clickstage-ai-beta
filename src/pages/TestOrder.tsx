import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, X } from "lucide-react";
import Layout from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { createOrderAndCheckout } from "@/lib/createOrder";
import uploadToServer from "@/lib/uploadToServer";
import modernFarmhouse from "@/assets/style-modern-farmhouse.jpg";
import coastal from "@/assets/style-coastal.jpg";
import scandinavian from "@/assets/style-scandinavian.jpg";
import contemporary from "@/assets/style-contemporary.jpg";
import midCentury from "@/assets/style-mid-century.jpg";
import transitional from "@/assets/style-transitional.jpg";
import japandi from "@/assets/style-japandi.jpg";

const TestOrder = () => {
  const [customerName, setCustomerName] = useState("Test User");
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const [propertyAddress, setPropertyAddress] = useState("123 Test St, Test City, TS 12345");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedBundle, setSelectedBundle] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const styles = [
    { id: "modern-farmhouse", name: "Modern Farmhouse", image: modernFarmhouse },
    { id: "coastal", name: "Coastal", image: coastal },
    { id: "scandinavian", name: "Scandinavian", image: scandinavian },
    { id: "contemporary", name: "Contemporary", image: contemporary },
    { id: "mid-century-modern", name: "Mid-Century Modern", image: midCentury },
    { id: "transitional", name: "Transitional", image: transitional },
    { id: "japandi", name: "Japandi", image: japandi },
  ];

  const bundles = [
    { id: "5", name: "5 Photos", price: "25" },
    { id: "10", name: "10 Photos", price: "45" },
    { id: "20", name: "20 Photos", price: "80" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    console.log("[TEST-ORDER] Files selected:", selectedFiles?.length || 0);

    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);

      const newPreviews: string[] = [];
      Array.from(selectedFiles).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === selectedFiles.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });

      console.log("[TEST-ORDER] File details:", Array.from(selectedFiles).map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })));
    }
  };

  const removeFile = (index: number) => {
    if (!files) return;

    const dt = new DataTransfer();
    const fileArray = Array.from(files);

    fileArray.forEach((file, i) => {
      if (i !== index) dt.items.add(file);
    });

    setFiles(dt.files.length > 0 ? dt.files : null);
    setPreviews(prev => prev.filter((_, i) => i !== index));

    console.log("[TEST-ORDER] File removed. Remaining files:", dt.files.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[TEST-ORDER] ========== FORM SUBMITTED ==========");

    const formData = {
      customerName,
      customerEmail,
      propertyAddress,
      selectedStyle,
      selectedBundle
    };

    console.log("[TEST-ORDER] Form data:", formData);

    if (!files || files.length === 0) {
      console.error("[TEST-ORDER] ❌ No files selected");
      alert("Please upload photos.");
      return;
    }

    console.log("[TEST-ORDER] ✓ Files validated:", files.length);

    if (!selectedStyle) {
      console.error("[TEST-ORDER] ❌ No style selected");
      alert("Please select a staging style.");
      return;
    }

    console.log("[TEST-ORDER] ✓ Style validated:", selectedStyle);

    if (!selectedBundle) {
      console.error("[TEST-ORDER] ❌ No bundle selected");
      alert("Please select a bundle.");
      return;
    }

    console.log("[TEST-ORDER] ✓ Bundle validated:", selectedBundle);

    console.log("[TEST-ORDER] Calling createOrderAndCheckout...");

    try {
      const orderId = crypto.randomUUID();  // Upload images FIRST console.log("[TEST-ORDER] Uploading files to Supabase..."); await uploadToServer(Array.from(files), orderId); console.log("[TEST-ORDER] Files uploaded successfully");  // Then create the order + Stripe checkout session console.log("[TEST-ORDER] Creating order + checkout session..."); await createOrderAndCheckout({ ...formData, orderId });
      console.log("[TEST-ORDER] ✓ createOrderAndCheckout completed successfully");
    } catch (error) {
      console.error("[TEST-ORDER] ❌ Error in createOrderAndCheckout:", error);
    }
  };

  return (
    <Layout>
      <SEO
        title="Test Order | Virtual Staging Pipeline Test"
        description="Test page for end-to-end order pipeline testing"
        canonical="/test-order"
      />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Test Order Pipeline</CardTitle>
                <CardDescription>
                  Complete end-to-end test of the order flow: Form → Upload → Checkout → Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="propertyAddress">Property Address</Label>
                    <Input
                      id="propertyAddress"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      placeholder="123 Main St, City, State, ZIP"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="selectedStyle">Staging Style</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger id="selectedStyle">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="selectedBundle">Bundle Package</Label>
                    <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                      <SelectTrigger id="selectedBundle">
                        <SelectValue placeholder="Select a bundle" />
                      </SelectTrigger>
                      <SelectContent>
                        {bundles.map((bundle) => (
                          <SelectItem key={bundle.id} value={bundle.price}>
                            {bundle.name} - ${bundle.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="file-upload">Upload Photos</Label>
                    <div className="mt-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                          >
                            Choose files
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>

                    {previews.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        {previews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Console Logs Active</h4>
                    <p className="text-sm text-blue-800">
                      Open your browser's developer console (F12) to see detailed logs of:
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Form submission</li>
                      <li>File selection and validation</li>
                      <li>Supabase upload progress</li>
                      <li>Stripe checkout session creation</li>
                      <li>Redirect to Stripe</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Test Complete Pipeline
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default TestOrder;
