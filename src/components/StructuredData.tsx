import { useEffect } from "react";

interface StructuredDataProps {
  locationContext?: string;
}

export function StructuredData({ locationContext }: StructuredDataProps) {
  useEffect(() => {
    // WebApplication Schema
    const webAppSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "What Car Should I Buy?",
      "description": "AI-powered car recommendation tool that helps you find the perfect vehicle based on your budget, lifestyle, and driving needs.",
      "url": typeof window !== "undefined" ? window.location.origin : "",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Personalized car recommendations",
        "Budget-based vehicle matching",
        "Safety rating analysis",
        "Fuel economy comparison",
        "Family vehicle suggestions"
      ]
    };

    // Organization Schema
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "What Car Should I Buy?",
      "url": typeof window !== "undefined" ? window.location.origin : "",
      "description": "Free AI-powered car recommendation service helping drivers find their perfect vehicle match."
    };

    // BreadcrumbList Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": typeof window !== "undefined" ? window.location.origin : ""
        }
      ]
    };

    // Inject schemas
    const existingScripts = document.querySelectorAll('script[data-schema]');
    existingScripts.forEach(script => script.remove());

    const schemas = [webAppSchema, orgSchema, breadcrumbSchema];
    schemas.forEach((schema, index) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", `schema-${index}`);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      const scripts = document.querySelectorAll('script[data-schema]');
      scripts.forEach(script => script.remove());
    };
  }, [locationContext]);

  return null;
}
