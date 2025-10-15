import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/data/schema";

const blogPosts = [
  {
    slug: "virtual-staging-complete-guide",
    title: "Virtual Staging for Real Estate Agents: Complete Guide 2025",
    description: "Everything real estate agents need to know about virtual staging - from costs to compliance, best practices to ROI.",
    date: "January 15, 2025",
    readTime: "12 min read",
    category: "Guides"
  },
  {
    slug: "virtual-staging-for-photographers",
    title: "How Real Estate Photographers Can Offer Virtual Staging Services",
    description: "Expand your photography business by adding virtual staging services. Learn pricing strategies and client communication.",
    date: "January 14, 2025",
    readTime: "10 min read",
    category: "For Photographers"
  },
  {
    slug: "ai-virtual-staging-explained",
    title: "AI Virtual Staging: How It Works and Why It Sells Homes Faster",
    description: "Discover the technology behind AI virtual staging and why staged homes sell 73% faster than empty properties.",
    date: "January 13, 2025",
    readTime: "8 min read",
    category: "Technology"
  },
  {
    slug: "virtual-staging-before-after",
    title: "Before and After: Real Virtual Staging Examples that Convert",
    description: "See stunning transformations and learn what makes virtual staging effective for real estate marketing.",
    date: "January 12, 2025",
    readTime: "7 min read",
    category: "Case Studies"
  },
  {
    slug: "virtual-staging-tools-comparison",
    title: "Top 10 Virtual Staging Tools Compared (Free & Paid) 2025",
    description: "Comprehensive comparison of virtual staging platforms, from DIY tools to professional services like ClickStage Pro.",
    date: "January 11, 2025",
    readTime: "15 min read",
    category: "Reviews"
  }
];

export default function Blog() {
  const schema = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" }
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Virtual Staging Blog - Tips, Guides & Industry Insights"
        description="Expert insights on virtual staging for real estate agents and photographers. Learn best practices, see case studies, and stay updated on industry trends."
        canonical="/blog"
        keywords="virtual staging blog, real estate staging tips, virtual staging guide, real estate photography tips"
        schema={schema}
      />
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Virtual Staging Insights & Resources
              </h1>
              <p className="text-xl text-muted-foreground">
                Expert tips, guides, and industry insights for real estate professionals
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.slug} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{post.date}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                    <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                    <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded mb-3">
                      {post.category}
                    </div>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full">
                      <Link to={`/blog/${post.slug}`}>
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
