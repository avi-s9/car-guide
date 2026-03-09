import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
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
    if (score >= 90) return "bg-success";
    if (score >= 80) return "bg-primary";
    return "bg-muted-foreground";
  };

  const getBadge = (index: number) => {
    if (index === 0) return "Best overall";
    if (recommendations.length > 2 && index === 1) return "Runner-up";
    return undefined;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/quiz")}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Refine answers
          </Button>
        </div>

        {/* Summary */}
        <div className="mb-10 mt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {recommendations.length} matches found
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your top matches
          </h1>
          {userInput && (
            <p className="text-muted-foreground text-sm max-w-xl">
              Based on your preferences, these cars are the best fit for you.
            </p>
          )}
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {recommendations.map((car: CarRecommendation, index: number) => {
            const displayScore = normalizeScore(car.score);
            return (
              <CarCard
                key={index}
                car={car}
                index={index}
                displayScore={displayScore}
                getScoreColor={getScoreColor}
                badge={getBadge(index)}
              />
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">Not quite right?</p>
          <Button
            onClick={() => navigate("/quiz")}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Adjust your preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
