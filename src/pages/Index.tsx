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
      const { data: parseData, error: parseError } =
        await supabase.functions.invoke("parse-preferences", {
          body: {
            userInput: preferences,
          },
        });

      if (parseError) throw parseError;

      const preferencesPayload = {
        budgetLow: parseData?.budgetLow ?? 20000,
        budgetHigh: parseData?.budgetHigh ?? 30000,
        bodyStyle: parseData?.bodyStyle ?? null,
        priorities: parseData?.priorities ?? [],
      };

      console.log("Parsed preferencesPayload:", preferencesPayload);
      const { data: recData, error: recError } =
        await supabase.functions.invoke("recommend", {
          body: {
            preferences: preferencesPayload,
            userInput: preferences, // 👈 send the raw text too
          },
        });

      console.log("recData from recommend:", recData, "recError:", recError);

      if (recError) throw recError;

      // ✅ use recData directly
      navigate("/results", {
        state: {
          recommendations: recData.recommendations,
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

  const handleLuckyClick = async () => {
    setIsLoading(true);
    try {
      const preferencesPayload = {
        budgetLow: 15000,
        budgetHigh: 50000,
        bodyStyle: null,
        priorities: [],
      };

      const { data: recData, error: recError } =
        await supabase.functions.invoke("recommend", {
          body: {
            preferences: preferencesPayload,
            userInput: "I'm feeling lucky! Surprise me with a great car.",
          },
        });

      if (recError) throw recError;

      // Take just the first recommendation
      navigate("/results", {
        state: {
          recommendations: [recData.recommendations[0]],
          userInput: "🍀 Lucky Pick",
        },
      });
    } catch (error) {
      console.error("Error in handleLuckyClick:", error);
      toast.error("Failed to get recommendation. Please try again.");
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            What Car Should I Buy?
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
            <div className="flex justify-between items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {preferences.length} characters
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleLuckyClick}
                  disabled={isLoading}
                  size="lg"
                  variant="outline"
                >
                  🍀 I'm feeling lucky
                </Button>
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
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => navigate("/quiz")}
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                Prefer a guided quiz instead?
              </button>
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
