import { Helmet } from "react-helmet";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  schema?: object;
  keywords?: string;
  preloadImages?: Array<{ href: string; fetchpriority?: 'high' | 'low' | 'auto' }>;
}

export const SEO = ({ title, description, canonical, ogImage, schema, keywords, preloadImages }: SEOProps) => {
  const siteUrl = "https://www.clickstagepro.com";
  const fullTitle = `${title} | ClickStage Pro`;
  const defaultImage = `${siteUrl}/og-image.jpg`;
  
  // Always provide a canonical URL to avoid conflicts between www and non-www versions
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : `${siteUrl}${typeof window !== 'undefined' ? window.location.pathname : ''}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Preload critical images for LCP optimization */}
      {preloadImages && preloadImages.map((img, index) => (
        <link 
          key={index}
          rel="preload" 
          as="image" 
          href={img.href} 
          // @ts-ignore - fetchpriority is a valid HTML attribute
          fetchpriority={img.fetchpriority || 'auto'}
        />
      ))}
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="ClickStage Pro" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage || defaultImage} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="ClickStage Pro" />
      
      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
