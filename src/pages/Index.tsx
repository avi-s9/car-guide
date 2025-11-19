import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Car, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [preferences, setPreferences] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // NEW handleSubmit: derive preferences on the frontend and call only `recommend`
  const handleSubmit = async () => {
    //console.log("handleSubmit called, raw text:", preferences);

    if (!preferences.trim()) {
      toast.error("Please describe your driving situation");
      return;
    }

    // ---- derive preferences on the frontend ----
    const text = preferences.toLowerCase();

    // defaults
    let budgetLow = 20000;
    let budgetHigh = 30000;
    let bodyStyle: string | null = null;
    const priorityTags: string[] = [];

    // very simple budget parsing: "$25k", "25k", "$25000"
    const dollarMatch = text.match(/\$?\s*(\d{2,3})\s*k\b/);
    const fullNumMatch = text.match(/\$?\s*(\d{5})\b/);

    if (dollarMatch) {
      const mid = parseInt(dollarMatch[1], 10) * 1000;
      budgetLow = mid - 5000;
      budgetHigh = mid + 5000;
    } else if (fullNumMatch) {
      const mid = parseInt(fullNumMatch[1], 10);
      budgetLow = mid - 3000;
      budgetHigh = mid + 3000;
    }

    // body style from keywords
    if (text.includes("suv") || text.includes("crossover")) {
      bodyStyle = "compact suv";
    } else if (text.includes("hatchback")) {
      bodyStyle = "hatchback";
    } else if (text.includes("sedan")) {
      bodyStyle = "sedan";
    }

    // priorities that match your car.tags values
    if (text.includes("fuel") || text.includes("mpg") || text.includes("gas")) {
      priorityTags.push("fuel-economy");
    }
    if (text.includes("safe") || text.includes("safety")) {
      priorityTags.push("safe");
    }
    if (text.includes("family") || text.includes("kids") || text.includes("space")) {
      priorityTags.push("spacious");
    }
    if (text.includes("reliable") || text.includes("reliability")) {
      priorityTags.push("reliable");
    }

    const preferencesPayload = {
      budgetLow,
      budgetHigh,
      bodyStyle,
      priorities: priorityTags,
    };

    console.log("Derived preferencesPayload:", preferencesPayload);

    setIsLoading(true);
    try {
      const { data: recData, error: recError } =
        await supabase.functions.invoke("recommend", {
          body: { preferences: preferencesPayload },
        });
      
      console.log("recData from recommend:", recData, "recError:", recError);
      
      if (recError) throw recError;

      /*
      // NEW: call explain function to add AI-generated explanations
      const { data: explainData, error: explainError } =
        await supabase.functions.invoke("explain", {
          body: {
            userInput: preferences,
            recommendations: recData.recommendations,
          },
        });
      
      console.log("explainData from explain:", explainData, "explainError:", explainError);
      
      if (explainError) throw explainError;
      */
      navigate("/results", {
        state: {
          // use recommendations that now include aiExplanation
          recommendations: explainData.recommendations,
          userInput: preferences,
        },
      });

    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CarGuide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find your perfect car match with AI-powered recommendations tailored to your lifestyle
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Smart Matching</h3>
            <p className="text-sm text-muted-foreground">
              AI analyzes your needs to find the perfect vehicles
            </p>
          </Card>
          <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Data-Driven</h3>
            <p className="text-sm text-muted-foreground">
              Recommendations based on comprehensive car data
            </p>
          </Card>
          <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
              <Car className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Top 3 Picks</h3>
            <p className="text-sm text-muted-foreground">
              Get the best matches without overwhelming choices
            </p>
          </Card>
        </div>

        {/* Main Input Card */}
        <Card className="p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Describe Your Situation</h2>
          <div className="space-y-4">
            <Textarea
              placeholder="Example: I drive mostly in the city, need good fuel economy, and prefer a compact car with modern safety features. My budget is around $25,000..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="min-h-[180px] text-base resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {preferences.length} characters
              </p>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isLoading ? "Finding matches..." : "Continue"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Powered by intelligent car matching algorithms
        </p>
      </div>
    </div>
  );
};

export default Index;
