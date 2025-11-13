import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load all route components for better performance
const Home = lazy(() => import("./pages/Home"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Auth = lazy(() => import("./pages/Auth"));
const Upload = lazy(() => import("./pages/Upload"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const SMSPolicy = lazy(() => import("./pages/SMSPolicy"));
const Styles = lazy(() => import("./pages/Styles"));
const PlaceOrder = lazy(() => import("./pages/PlaceOrder"));
const About = lazy(() => import("./pages/About"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/AdminOrderDetail"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminImages = lazy(() => import("./pages/admin/AdminImages"));
const AdminBulkUpload = lazy(() => import("./pages/admin/AdminBulkUpload"));
const Blog = lazy(() => import("./pages/Blog"));
const VirtualStagingGuide = lazy(() => import("./pages/blog/VirtualStagingGuide"));
const Success = lazy(() => import("./pages/Success"));
const PurchaseCredits = lazy(() => import("./pages/PurchaseCredits"));
const CreditsSuccess = lazy(() => import("./pages/CreditsSuccess"));
const StabilityTest = lazy(() => import("./pages/StabilityTest"));
const CheckoutDiagnostics = lazy(() => import("./pages/CheckoutDiagnostics"));
const ClientGallery = lazy(() => import("./pages/ClientGallery"));
const BucketTest = lazy(() => import("./pages/BucketTest"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/sms-policy" element={<SMSPolicy />} />
          <Route path="/styles" element={<Styles />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/about" element={<About />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/images" element={<AdminImages />} />
          <Route path="/admin/bulk-upload" element={<AdminBulkUpload />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/virtual-staging-complete-guide" element={<VirtualStagingGuide />} />
          <Route path="/success" element={<Success />} />
          <Route path="/purchase-credits" element={<PurchaseCredits />} />
          <Route path="/credits-success" element={<CreditsSuccess />} />
          <Route path="/stability-test" element={<StabilityTest />} />
          <Route path="/diagnostics" element={<CheckoutDiagnostics />} />
          <Route path="/bucket-test" element={<BucketTest />} />
          <Route path="/gallery/:token" element={<ClientGallery />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
