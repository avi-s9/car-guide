import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Car, Clock, Shield, ThumbsUp, Shuffle, ArrowRight, MessageSquare, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const promptSuggestions = [
  { label: "Budget", text: "My budget is around $25,000" },
  { label: "Family", text: "I need space for 2 kids and a dog" },
  { label: "Commute", text: "I drive 30 miles daily in city traffic" },
  { label: "Fuel", text: "I prefer good fuel economy or hybrid" },
  { label: "Safety", text: "Modern safety features are a priority" },
  { label: "Size", text: "I want something compact and easy to park" },
];

const Index = () => {
  const [preferences, setPreferences] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"describe" | "quiz">("describe");
  const navigate = useNavigate();

  const handleSuggestionClick = (text: string) => {
    setPreferences((prev) => {
      if (prev.trim()) {
        return `${prev}. ${text}`;
      }
      return text;
    });
  };

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

      const { data: recData, error: recError } =
        await supabase.functions.invoke("recommend", {
          body: {
            preferences: preferencesPayload,
            userInput: preferences,
          },
        });

      if (recError) throw recError;

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
            Get personalized car recommendations in under a minute — no signup required
          </p>
        </div>

        {/* Benefits - Outcome focused */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
              <ThumbsUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Stop Second-Guessing</h3>
            <p className="text-sm text-muted-foreground">
              Get confident picks tailored to your exact needs and budget
            </p>
          </Card>
          <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Save Hours of Research</h3>
            <p className="text-sm text-muted-foreground">
              Skip the endless comparisons — we surface the best options instantly
            </p>
          </Card>
          <Card className="p-6 text-center border-2 hover:border-primary/50 transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-3">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Make the Right Choice</h3>
            <p className="text-sm text-muted-foreground">
              Understand exactly why each car fits your lifestyle
            </p>
          </Card>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border-2 border-border p-1 bg-muted/50">
            <button
              onClick={() => setInputMode("describe")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                inputMode === "describe"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Describe Your Needs
            </button>
            <button
              onClick={() => setInputMode("quiz")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                inputMode === "quiz"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Guided Quiz
            </button>
          </div>
        </div>

        {/* Main Input Card */}
        {inputMode === "describe" ? (
          <Card className="p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">Tell us about your situation</h2>
            <p className="text-muted-foreground mb-4">
              Describe your driving needs in your own words, or use the suggestions below to get started.
            </p>

            {/* Prompt Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {promptSuggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="px-3 py-1.5 text-sm rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                >
                  + {suggestion.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Example: I have two kids and need a reliable SUV under $35,000 with good safety ratings..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="min-h-[140px] text-base resize-none"
              />

              {/* CTA Section */}
              <div className="space-y-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !preferences.trim()}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6"
                >
                  {isLoading ? "Finding your matches..." : "Get My Recommendations"}
                  {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Takes under a minute
                  </span>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" /> No signup required
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <button
                  onClick={handleLuckyClick}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Shuffle className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>I'm feeling lucky — surprise me with a great pick</span>
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 shadow-lg text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <ListChecks className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Answer a few quick questions</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Not sure what to say? Our guided quiz will walk you through the key decisions step by step.
            </p>
            <Button
              onClick={() => navigate("/quiz")}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6"
            >
              Start the Quiz
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 5 quick questions
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" /> No signup required
              </span>
            </div>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Powered by intelligent car matching algorithms
        </p>
      </div>
    </div>
  );
};

export default Index;
