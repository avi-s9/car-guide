import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCcw } from "lucide-react";
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

  const rawScores = recommendations.map((car: CarRecommendation) => car.score);
  const minScore = Math.min(...rawScores);
  const maxScore = Math.max(...rawScores);

  const normalizeScore = (score: number) => {
    if (maxScore === minScore) return 90;
    const ratio = (score - minScore) / (maxScore - minScore);
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
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Top Matches
          </h1>
          {userInput && (
            <p className="text-muted-foreground text-sm">
              Based on: {userInput.substring(0, 120)}
            </p>
          )}
        </div>

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

        <Card className="mt-8 p-6 text-center bg-gradient-to-r from-primary/10 to-accent/10 border border-border/60">
          <p className="text-lg mb-4 font-medium">Want different results?</p>
          <Button
            onClick={() => navigate("/quiz")}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refine answers
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Results;
