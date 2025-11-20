import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Car } from "lucide-react";

const Quiz = () => {
  const navigate = useNavigate();
  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");
  const [bodyStyle, setBodyStyle] = useState("any");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const togglePriority = (value: string) => {
    setPriorities((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    const budgetLow =
      typeof minBudget === "number" && !Number.isNaN(minBudget)
        ? minBudget
        : 20000;
    const budgetHigh =
      typeof maxBudget === "number" && !Number.isNaN(maxBudget)
        ? maxBudget
        : 30000;

    if (budgetLow > budgetHigh) {
      toast.error("Minimum budget cannot be greater than maximum budget.");
      return;
    }

    const preferencesPayload = {
      budgetLow,
      budgetHigh,
      bodyStyle: bodyStyle === "any" ? null : bodyStyle,
      priorities,
    };

    const descriptionForAI = `From quiz: budget ~$${budgetLow.toLocaleString()}–$${budgetHigh.toLocaleString()}, preferred body style: ${
      bodyStyle === "any" ? "no strong preference" : bodyStyle
    }, priorities: ${priorities.length ? priorities.join(", ") : "none specified"}.`;

    setIsLoading(true);
    try {
      const { data: recData, error: recError } =
        await supabase.functions.invoke("recommend", {
          body: {
            preferences: preferencesPayload,
            userInput: descriptionForAI,
          },
        });

      if (recError) throw recError;

      navigate("/results", {
        state: {
          recommendations: recData.recommendations,
          userInput: descriptionForAI,
        },
      });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const bodyStyleOptions = [
    { value: "any", label: "No preference" },
    { value: "sedan", label: "Sedan" },
    { value: "compact suv", label: "Compact SUV" },
    { value: "hatchback", label: "Hatchback" },
  ];

  const priorityOptions = [
    { value: "fuel-economy", label: "Great fuel economy" },
    { value: "safe", label: "Top safety" },
    { value: "spacious", label: "Space for family / cargo" },
    { value: "reliable", label: "Long-term reliability" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back Link */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to free text input
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Guided Car Quiz
          </h1>
          <p className="text-lg text-muted-foreground">
            Answer a few quick questions and we'll recommend the best matches.
          </p>
        </div>

        {/* Quiz Card */}
        <Card className="p-8 shadow-lg space-y-8">
          {/* Budget Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What's your budget range?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBudget">Minimum budget ($)</Label>
                <Input
                  id="minBudget"
                  type="number"
                  placeholder="20000"
                  value={minBudget}
                  onChange={(e) =>
                    setMinBudget(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBudget">Maximum budget ($)</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  placeholder="30000"
                  value={maxBudget}
                  onChange={(e) =>
                    setMaxBudget(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
            </div>
          </div>

          {/* Body Style */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              What body style do you prefer?
            </h3>
            <div className="flex flex-wrap gap-3">
              {bodyStyleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBodyStyle(option.value)}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    bodyStyle === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-muted hover:border-primary/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              What matters most to you? (Select all that apply)
            </h3>
            <div className="space-y-3">
              {priorityOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={option.value}
                    checked={priorities.includes(option.value)}
                    onCheckedChange={() => togglePriority(option.value)}
                  />
                  <Label
                    htmlFor={option.value}
                    className="text-base cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {isLoading ? "Finding matches..." : "See my recommendations"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
