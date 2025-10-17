export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ClickStagePro",
  "url": "https://www.clickstagepro.com",
  "logo": "https://www.clickstagepro.com/images/logo.png",
  "description": "AI-powered virtual staging for real estate photos. Upload your listing photos and get photorealistic, MLS-compliant staged images in 24 hours.",
  "serviceType": "Virtual Staging",
  "areaServed": "United States",
  "priceRange": "$",
  "sameAs": [
    "https://www.facebook.com/clickstagepro",
    "https://www.instagram.com/clickstagepro",
    "https://www.linkedin.com/company/clickstagepro"
  ]
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "ClickStage Pro",
  "image": "https://clickstagepro.com/logo.png",
  "url": "https://clickstagepro.com",
  "telephone": "+1-864-555-0100",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Greenville",
    "addressRegion": "SC",
    "postalCode": "29601",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 34.8526,
    "longitude": -82.3940
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "09:00",
    "closes": "17:00"
  }
};

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Virtual Staging Services",
  "provider": {
    "@type": "Organization",
    "name": "ClickStage Pro"
  },
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Virtual Staging Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Basic Virtual Staging Package",
          "description": "Professional virtual staging for real estate listings"
        }
      }
    ]
  }
};

export const productSchema = (credits: number, price: number) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": `${credits} Virtual Staging Credits`,
  "description": `Professional virtual staging credits for real estate photos`,
  "brand": {
    "@type": "Brand",
    "name": "ClickStage Pro"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://clickstagepro.com/pricing",
    "priceCurrency": "USD",
    "price": price,
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "ClickStage Pro"
    }
  }
});

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `https://clickstagepro.com${item.url}`
  }))
});
