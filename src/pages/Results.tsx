import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Gauge, Shield, Droplets } from "lucide-react";
import { useEffect } from "react";

interface CarRecommendation {
  make: string;
  model: string;
  year: number;
  priceRange: string;
  reasons: string[];
  score: number;
  fuelEconomy: string;
  safetyRating: number;
  type: string;
  aiExplanation?: string;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recommendations, userInput } = location.state || {};

  useEffect(() => {
    if (!recommendations) {
      navigate("/");
    }
  }, [recommendations, navigate]);

  if (!recommendations) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Top 3 Matches
          </h1>
          <p className="text-muted-foreground">
            Based on your preferences: "{userInput?.substring(0, 100)}..."
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid gap-6">
          {recommendations.map((car: CarRecommendation, index: number) => (
            <Card
              key={index}
              className="border-2 hover:border-primary/50 transition-all shadow-lg overflow-hidden"
            >
              <div className="flex">
                {/* Ranking Badge */}
                <div className="w-20 bg-gradient-to-b from-primary to-accent flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">#{index + 1}</div>
                    <div className="text-xs text-white/80">Match</div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-1">
                          {car.year} {car.make} {car.model}
                        </CardTitle>
                        <CardDescription className="text-base">
                          <Badge variant="secondary" className="mr-2">
                            {car.type}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            {car.priceRange}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-white font-semibold ${getScoreColor(
                            car.score
                          )}`}
                        >
                          {car.score}% Match
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <Droplets className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Fuel Economy</div>
                          <div className="font-semibold">{car.fuelEconomy}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Safety</div>
                          <div className="font-semibold">{car.safetyRating}/5 stars</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Price</div>
                          <div className="font-semibold">{car.priceRange}</div>
                        </div>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-primary" />
                        Why This Car Matches You
                      </h4>
                     {Array.isArray(car.reasons) && car.reasons.length > 0 && (
                      <ul className="space-y-2">
                        {car.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                      {car.aiExplanation && (
                        <p className="mt-4 text-sm text-foreground">
                        {car.aiExplanation}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="mt-8 p-6 text-center bg-gradient-to-r from-primary/10 to-accent/10 border-2">
          <p className="text-lg mb-4">Want to refine your search?</p>
          <Button
            onClick={() => navigate("/")}
            size="lg"
            variant="outline"
            className="border-primary/50 hover:border-primary"
          >
            Start New Search
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Results;
