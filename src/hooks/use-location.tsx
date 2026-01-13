import { useState, useEffect } from "react";

interface LocationData {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_LOCATION: LocationData = {
  city: null,
  region: null,
  country: null,
  countryCode: null,
  isLoading: false,
  error: null,
};

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    ...DEFAULT_LOCATION,
    isLoading: true,
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Use a free, privacy-respecting IP geolocation service
        const response = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }
        
        const data = await response.json();
        
        setLocation({
          city: data.city || null,
          region: data.region || null,
          country: data.country_name || null,
          countryCode: data.country_code || null,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        // Silently fail - location is optional
        setLocation({
          ...DEFAULT_LOCATION,
          isLoading: false,
          error: error instanceof Error ? error.message : "Location unavailable",
        });
      }
    };

    fetchLocation();
  }, []);

  // Helper to get location-aware text with fallback
  const getLocationText = (template: string, fallback: string): string => {
    if (location.isLoading || !location.city) {
      return fallback;
    }
    return template
      .replace("{city}", location.city || "")
      .replace("{region}", location.region || "")
      .replace("{country}", location.country || "");
  };

  // Get driving context based on location
  const getDrivingContext = (): string => {
    if (location.isLoading || !location.city) {
      return "your area";
    }
    return `${location.city}${location.region ? `, ${location.region}` : ""}`;
  };

  return {
    ...location,
    getLocationText,
    getDrivingContext,
  };
}
