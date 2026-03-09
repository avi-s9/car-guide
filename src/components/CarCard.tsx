import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Gauge, Fuel, Car, Trophy, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  badge?: string;
}

export const CarCard = ({ car, index, displayScore, getScoreColor, badge }: CarCardProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchCarImage = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("car-image-proxy", {
          body: { make: car.make, model: car.model, year: car.year },
        });

        if (error) {
          setImageUrl(null);
        } else if (data?.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          setImageUrl(null);
        }
      } catch {
        setImageUrl(null);
      } finally {
        setImageLoading(false);
      }
    };

    fetchCarImage();
  }, [car.make, car.model, car.year]);

  return (
    <div className="group rounded-2xl border border-border bg-card shadow-card hover:shadow-card-hover transition-all overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {imageLoading ? (
          <Skeleton className="w-full h-full" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            onError={() => setImageUrl(null)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Car className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Rank badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center text-sm font-bold text-foreground">
            {index + 1}
          </div>
          {badge && (
            <Badge className="bg-primary text-primary-foreground border-0 shadow-card text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              {badge}
            </Badge>
          )}
        </div>

        {/* Score */}
        <div className="absolute top-3 right-3">
          <div className={`${getScoreColor(displayScore)} text-primary-foreground px-2.5 py-1 rounded-full text-xs font-semibold shadow-card`}>
            {displayScore}% match
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground mb-0.5">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-sm text-muted-foreground">{car.type}</p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{car.priceRange}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Fuel className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{car.fuelEconomy}</span>
          </div>
          {car.safetyRating != null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">{car.safetyRating}/5</span>
            </div>
          )}
        </div>

        {/* Why this match */}
        {car.aiExplanation && (
          <div className="p-3 rounded-xl bg-muted/50 border border-border mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Why this car: </span>
              {car.aiExplanation}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {car.reasons.map((reason, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs font-normal">
              {reason}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
