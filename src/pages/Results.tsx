import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { CarCard } from "@/components/CarCard";

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

    // Normalize scores so they land between 70–100 for display
  const rawScores = recommendations.map((car: CarRecommendation) => car.score);
  const minScore = Math.min(...rawScores);
  const maxScore = Math.max(...rawScores);
  
  const normalizeScore = (score: number) => {
    if (maxScore === minScore) {
      // all scores are equal, just pick a nice mid-high number
      return 90;
    }
    const ratio = (score - minScore) / (maxScore - minScore);
    // map to [70, 100]
    return Math.round(70 + ratio * 30);
  };

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
          {recommendations.map((car: CarRecommendation, index: number) => {
            const displayScore = normalizeScore(car.score);

            return (
              <CarCard
                key={index}
                car={car}
                index={index}
                displayScore={displayScore}
                getScoreColor={getScoreColor}
              />
            );
          })}
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
