import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <h1>ClickStage Pro — Terms of Service</h1>
          
          <p><strong>Effective Date:</strong> 10/14/2025</p>
          <p><strong>Entity:</strong> Warfield & Company, Ltd Co. DBA ClickStage Pro ("ClickStage Pro," "we," "us," "our")</p>
          <p><strong>Website:</strong> https://www.clickstagepro.com</p>
          <p><strong>Address:</strong> 403 Woods Lake Rd Suite 100, Greenville, SC 29607</p>
          <p><strong>Contact:</strong> legal@clickstagepro.com</p>
          <p><strong>Governing Law:</strong> South Carolina, USA</p>

          <h2>1) Overview</h2>
          <p>We provide virtual staging and related creative/AI‑assisted image services (the "Services"). By using our site or Services, you agree to these Terms and our Privacy Policy.</p>

          <h2>2) Eligibility & Accounts</h2>
          <ul>
            <li>You must be able to form a binding contract.</li>
            <li>Keep your credentials secure; you're responsible for all activity in your account.</li>
            <li>Report unauthorized use promptly.</li>
          </ul>

          <h2>3) Plans, Trials, Fees & Taxes</h2>
          <ul>
            <li>Pricing, credits, plans, and any usage limits are shown at checkout or on our pricing page.</li>
            <li>Subscriptions auto‑renew unless canceled before renewal.</li>
            <li>Free trials convert to paid unless canceled before the trial ends.</li>
            <li>All fees are non‑refundable unless we state otherwise in writing. Taxes may apply.</li>
          </ul>

          <h2>4) Deliverables & License</h2>
          <ul>
            <li>After payment, we grant you a limited, non‑exclusive, non‑transferable license to use delivered images solely for marketing the subject property.</li>
            <li>No resale/sublicense or use to train competing services without our written consent.</li>
            <li>We may showcase anonymized or watermarked samples for portfolio, product training, and marketing; email legal@clickstagepro.com to opt out.</li>
          </ul>

          <h2>5) Your Content & Rights</h2>
          <ul>
            <li>You represent you own or control rights to all uploaded content and instructions.</li>
            <li>You grant us a license to host, process, edit, and transform your content to provide the Services.</li>
          </ul>

          <h2>6) AI & Accuracy</h2>
          <ul>
            <li>Some outputs use AI. Results may vary and may contain artifacts.</li>
            <li>You are responsible for accuracy and for using clear "virtually staged" disclosures. See Section 12.</li>
          </ul>

          <h2>7) Acceptable Use</h2>
          <p>Do not:</p>
          <ul>
            <li>Violate laws or third‑party rights.</li>
            <li>Upload malware or attempt to bypass security.</li>
            <li>Scrape, reverse engineer, or overload our systems.</li>
            <li>Misrepresent a property's condition or dimensions.</li>
          </ul>

          <h2>8) Third‑Party Services</h2>
          <p>We integrate payment, storage, and AI vendors. Their terms/privacy apply in addition to ours.</p>

          <h2>9) Disclaimers</h2>
          <p>Services and site are provided "as is" and "as available." No warranty of merchantability, fitness, non‑infringement, or uninterrupted availability.</p>

          <h2>10) Limitation of Liability</h2>
          <ul>
            <li>No liability for indirect, incidental, special, or consequential damages.</li>
            <li>Our total liability is capped at fees you paid in the 12 months before the claim or $100, whichever is greater.</li>
          </ul>

          <h2>11) Indemnification</h2>
          <p>You'll defend and indemnify us from claims arising out of your content, your use, or your breach of these Terms.</p>

          <h2>12) Required Disclosures for Listings</h2>
          <p><strong>"Virtually Staged" label (near each image):</strong> Virtually staged for illustrative purposes.</p>
          <p><strong>Listing block:</strong> Some images are virtually staged to help buyers visualize potential furnishings and layouts. Dimensions and features may appear different from reality. Images are for illustration only and do not depict actual property conditions or included items. Verify measurements and fixtures independently.</p>

          <h2>13) IP & DMCA</h2>
          <ul>
            <li>Our site, software, models, training data, and brands are our IP.</li>
            <li><strong>DMCA Agent:</strong> Legal, Warfield & Company, Ltd Co., 403 Woods Lake Rd Suite 100, Greenville, SC 29607; legal@clickstagepro.com. Include all required elements.</li>
          </ul>

          <h2>14) Termination</h2>
          <ul>
            <li>You may stop using the Services anytime.</li>
            <li>We may suspend/terminate for breach, fraud, or risk to others. No refunds for partial periods.</li>
          </ul>

          <h2>15) Changes to Terms</h2>
          <p>We may update these Terms. Material changes will be posted with an updated Effective Date. Continued use means acceptance.</p>

          <h2>16) Governing Law & Dispute Resolution</h2>
          <ul>
            <li><strong>Law:</strong> South Carolina.</li>
            <li><strong>Arbitration:</strong> Binding arbitration in Greenville County, SC under AAA Commercial Rules.</li>
            <li><strong>Waivers:</strong> No class actions or jury trials.</li>
            <li>Small‑claims court in Greenville County, SC remains available.</li>
          </ul>

          <h2>17) Data Processing Addendum (B2B)</h2>
          <p>When we process personal data on behalf of business clients, our Data Processing Addendum (DPA) applies and is incorporated by reference. For a signed copy or sub‑processor list, contact legal@clickstagepro.com.</p>

          <h2>18) Contact</h2>
          <p>Warfield & Company, Ltd Co. DBA ClickStage Pro</p>
          <p>403 Woods Lake Rd Suite 100, Greenville, SC 29607</p>
          <p>legal@clickstagepro.com</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
