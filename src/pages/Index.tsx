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

  const handleSubmit = async () => {
    if (!preferences.trim()) {
      toast.error("Please describe your driving situation");
      return;
    }

    setIsLoading(true);
    try {
      // Call parse-preferences endpoint
      const { data: parsedData, error: parseError } = await supabase.functions.invoke(
        "parse-preferences",
        {
          body: { userInput: preferences },
        }
      );

      console.log("parsedData from parse-preferences:", parsedData);

      if (parseError) throw parseError;

      // Call recommend endpoint with parsed preferences
      const { data: recData, error: recError } = await supabase.functions.invoke(
        "recommend",
        {
          body: { preferences: parsedData },
        }
      );

      if (recError) throw recError;

      // Navigate to results page with recommendations
      navigate("/results", { state: { recommendations: recData.recommendations, userInput: preferences } });
    } catch (error) {
      console.error("Error:", error);
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
