import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Gauge,
  Shield,
  Droplets,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CarRecommendation {
  make: string;
  model: string;
  year: number;
  priceRange: string;
  reasons: string[];
  score: number;
  fuelEconomy: string;
  safetyRating?: number | null;
  type: string;
  aiExplanation?: string;
}

interface CarCardProps {
  car: CarRecommendation;
  index: number;
  displayScore: number;
  getScoreColor: (score: number) => string;
}

export const CarCard = ({ car, index, displayScore, getScoreColor }: CarCardProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchCarImage = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("car-image-proxy", {
          body: {
            make: car.make,
            model: car.model,
            year: car.year,
          },
        });

        if (error) {
          console.error("Error fetching car image:", error);
          setImageUrl(null);
        } else if (data?.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          setImageUrl(null);
        }
      } catch (err) {
        console.error("Error in fetchCarImage:", err);
        setImageUrl(null);
      } finally {
        setImageLoading(false);
      }
    };

    fetchCarImage();
  }, [car.make, car.model, car.year]);

  return (
    <Card className="border-2 hover:border-primary/50 transition-all shadow-lg overflow-hidden">
      <div className="flex">
        {/* Ranking Badge */}
        <div className="w-20 bg-gradient-to-b from-primary to-accent flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">
              #{index + 1}
            </div>
            <div className="text-xs text-white/80">Match</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Car Image */}
          <div className="w-full h-64 bg-muted relative overflow-hidden">
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <div className="animate-pulse text-muted-foreground">Loading image...</div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="w-full h-full object-cover"
                onError={() => setImageUrl(null)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">🚗</div>
                  <div className="text-sm">Image not available</div>
                </div>
              </div>
            )}
          </div>

          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-1">
                  {car.year} {car.make} {car.model}
                </CardTitle>
                <CardDescription className="text-base">
                  {car.type}
                </CardDescription>
              </div>
              <Badge className={`${getScoreColor(displayScore)} text-white px-3 py-1`}>
                {displayScore}/100
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Price Range</div>
                  <div className="font-semibold">{car.priceRange}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Fuel Economy</div>
                  <div className="font-semibold">{car.fuelEconomy}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Safety Rating</div>
                  <div className="font-semibold">
                    {car.safetyRating == null ? "N/A" : `${car.safetyRating}/5 ⭐`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Match Score</div>
                  <div className="font-semibold">{displayScore}/100</div>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            {car.aiExplanation && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 text-sm">Why this car?</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {car.aiExplanation}
                </p>
              </div>
            )}

            {/* Matching Reasons */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Key Matches:</h4>
              <div className="flex flex-wrap gap-2">
                {car.reasons.map((reason, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs"
                  >
                    ✓ {reason}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};
