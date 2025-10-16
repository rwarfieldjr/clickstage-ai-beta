import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { faqSchema } from "@/data/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DollarSign, Clock, Settings, FileText, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  const faqCategories = [
    {
      title: "Pricing & Plans",
      icon: DollarSign,
      questions: [
        {
          q: "How much does virtual staging cost?",
          a: "We offer flexible pricing bundles starting at $10 for a single photo. Our most popular package is the 10-photo bundle at $85 ($8.50 per photo), which saves you $15. Check out our pricing page for all available options and bulk discounts."
        },
        {
          q: "What is virtual staging?",
          a: "Virtual staging is the digital process of furnishing and decorating empty property photos. Using AI and professional design software, we add realistic furniture, decor, and styling to showcase a home's potential to buyers. It's a cost-effective alternative to traditional physical staging."
        },
        {
          q: "Do credits roll over?",
          a: "Yes! All purchased credits remain in your account until you use them. There's no expiration date, so you can buy in bulk and save while using credits at your own pace."
        },
        {
          q: "Do one-time bundles expire?",
          a: "No, one-time bundles never expire. Once you purchase a bundle, those credits stay in your account indefinitely until you use them for staging projects."
        },
        {
          q: "Can I share credits with my team?",
          a: "Team credit sharing is available on our Premium plan and above. Contact us to set up a team account where multiple users can access and use shared credits."
        }
      ]
    },
    {
      title: "Process & Turnaround",
      icon: Clock,
      questions: [
        {
          q: "What's the standard turnaround time?",
          a: "Standard turnaround is 24-48 hours from when you submit your photos. Most orders are completed within 24 hours during business days."
        },
        {
          q: "Do you offer rush delivery?",
          a: "Yes! Rush delivery (12 hours or less) is available for an additional fee. Contact us before placing your order to arrange expedited service."
        },
        {
          q: "What's included with each photo?",
          a: "Each staged photo includes professional furniture placement, decor styling, appropriate lighting adjustments, and one round of minor revisions at no extra cost."
        },
        {
          q: "What counts as a 'minor revision'?",
          a: "Minor revisions include adjusting furniture placement, changing decor items, or modifying colors. Major changes like completely different furniture styles or room layouts may require additional credits."
        },
        {
          q: "How do I submit photos?",
          a: "Simply log in to your dashboard, click 'Upload,' select your photos, choose your preferred staging style, and submit. You'll receive an email notification when your staged photos are ready."
        }
      ]
    },
    {
      title: "Technical Requirements",
      icon: Settings,
      questions: [
        {
          q: "What are the photo requirements and limits?",
          a: "Photos should be at least 2000px on the longest side, in JPG or PNG format. Maximum file size is 25MB per photo. The room should be well-lit and the space clearly visible."
        },
        {
          q: "Can you remove clutter from photos?",
          a: "Yes! We can remove small items like trash cans, cables, or minor clutter as part of the staging process. Extensive clutter removal may require additional credits."
        },
        {
          q: "Can you do day-to-dusk conversions?",
          a: "Absolutely! Day-to-dusk conversions are available as an add-on service. This dramatically enhances exterior photos by converting daytime shots to stunning twilight scenes."
        },
        {
          q: "Do you offer virtual renovations?",
          a: "Yes, we can handle virtual renovations including updating flooring, painting walls, modernizing kitchens and bathrooms, and more. Contact us for a custom quote based on your renovation needs."
        },
        {
          q: "Can you stage floor plans or do 2D staging?",
          a: "Currently, we specialize in 3D virtual staging of actual room photos. We don't offer 2D floor plan staging at this time."
        },
        {
          q: "What if my photos are low quality?",
          a: "We can work with most photos, but better quality input produces better results. If your photos don't meet our minimum requirements, we'll let you know and offer suggestions for improvement."
        },
        {
          q: "What furniture styles do you offer?",
          a: "We offer a wide range of styles including Modern, Contemporary, Traditional, Farmhouse, Industrial, Scandinavian, Mid-Century Modern, and more. You can specify your preferred style when uploading."
        },
        {
          q: "Can you follow specific brand guidelines?",
          a: "Yes! If you have specific brand guidelines or furniture preferences, let us know in the order notes and we'll match your requirements as closely as possible."
        }
      ]
    },
    {
      title: "Policies & Terms",
      icon: FileText,
      questions: [
        {
          q: "Do you label images as 'Virtually Staged'?",
          a: "We provide both labeled and unlabeled versions. However, we strongly recommend (and most real estate laws require) that you disclose virtual staging in your listings to maintain transparency with buyers."
        },
        {
          q: "Who owns the staged images?",
          a: "You retain full rights to the staged images once delivered. You can use them in any marketing materials, listings, or promotional content without attribution."
        },
        {
          q: "What's your cancellation policy?",
          a: "You can cancel any order before we begin working on it for a full refund. Once work has started, cancellations are subject to a 50% fee for work completed."
        },
        {
          q: "Do you offer refunds?",
          a: "If you're not satisfied with the final result after revisions, we offer a full refund. Your satisfaction is our priority, and we stand behind the quality of our work."
        },
        {
          q: "How long do you store my files?",
          a: "We store your original and staged files for 90 days after delivery. After that, files are automatically deleted from our servers for privacy and security."
        }
      ]
    },
    {
      title: "Support & Contact",
      icon: HelpCircle,
      questions: [
        {
          q: "How do I contact support?",
          a: "You can reach our support team via email at support@clickstagepro.com, through the contact form on our website, or via live chat during business hours (9 AM - 6 PM EST, Monday-Friday)."
        }
      ]
    }
  ];

  // Flatten all FAQs for schema
  const allFAQs = faqCategories.flatMap(cat => cat.questions.map(q => ({
    question: q.q,
    answer: q.a
  })));

  const schema = faqSchema(allFAQs);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Virtual Staging FAQ - Common Questions About Virtual Staging Services"
        description="Get answers to common questions about virtual staging. Learn about pricing, turnaround time, MLS compliance, and how virtual staging works for real estate."
        canonical="/faq"
        keywords="virtual staging FAQ, virtual staging questions, how does virtual staging work, MLS virtual staging rules, virtual staging turnaround"
        schema={schema}
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Frequently Asked <span className="text-accent">Questions</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about our virtual staging services, pricing, and process. 
                Can't find what you're looking for? <Link to="/contact" className="text-accent hover:underline">Contact our support team</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-12">
              {faqCategories.map((category, categoryIndex) => {
                const Icon = category.icon;
                return (
                  <div key={categoryIndex} className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <h2 className="text-2xl font-bold">{category.title}</h2>
                    </div>
                    
                    <Accordion type="single" collapsible className="space-y-2">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem 
                          key={faqIndex} 
                          value={`${categoryIndex}-${faqIndex}`}
                          className="border border-border rounded-lg px-6 bg-card hover:bg-muted/50 transition-colors"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium">{faq.q}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-4">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
