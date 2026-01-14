import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Car } from "lucide-react";

const Quiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [minBudget, setMinBudget] = useState<number | "">(20000);
  const [maxBudget, setMaxBudget] = useState<number | "">(30000);
  const [newUsed, setNewUsed] = useState("");
  const [bodyStyle, setBodyStyle] = useState("no-preference");
  const [people, setPeople] = useState("");
  const [cargo, setCargo] = useState("");
  const [driving, setDriving] = useState("");
  const [weather, setWeather] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 6;
  const progressValue = ((step + 1) / totalSteps) * 100;

  const togglePriority = (value: string) => {
    setPriorities((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : [...prev, value]
    );
  };

  const bodyStyleOptions = [
    { value: "no-preference", label: "No preference" },
    { value: "sedan", label: "Sedan" },
    { value: "compact suv", label: "Compact SUV" },
    { value: "hatchback", label: "Hatchback" },
  ];

  const priorityOptions = [
    { value: "fuel-economy", label: "Great fuel economy" },
    { value: "safe", label: "Top safety ratings" },
    { value: "spacious", label: "Space for family / cargo" },
    { value: "reliable", label: "Long-term reliability" },
    { value: "fun-to-drive", label: "Fun to drive" },
    { value: "premium", label: "Modern tech & features" },
  ];

  const bodyStyleLabel = useMemo(
    () =>
      bodyStyleOptions.find((option) => option.value === bodyStyle)?.label ??
      "No preference",
    [bodyStyle, bodyStyleOptions]
  );

  const isStepValid = useMemo(() => {
    if (step === 0) {
      const minValue =
        typeof minBudget === "number" && !Number.isNaN(minBudget)
          ? minBudget
          : 0;
      const maxValue =
        typeof maxBudget === "number" && !Number.isNaN(maxBudget)
          ? maxBudget
          : 0;
      return minValue >= 0 && maxValue > minValue;
    }
    if (step === 1) {
      return Boolean(newUsed);
    }
    if (step === 2) {
      return true;
    }
    if (step === 3) {
      return Boolean(people) && Boolean(cargo);
    }
    if (step === 4) {
      return Boolean(driving) && Boolean(weather);
    }
    return true;
  }, [step, minBudget, maxBudget, newUsed, people, cargo, driving, weather]);

  const handleNext = () => {
    if (!isStepValid) {
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    handleNext();
  };

  const buildPriorities = () => {
    const prioritySet = new Set(priorities);
    if (people === "4–5 people" || people === "Often more than 5") {
      prioritySet.add("family");
    }
    if (cargo === "Very important") {
      prioritySet.add("spacious");
    }
    if (weather === "Yes, often") {
      prioritySet.add("all-wheel-drive");
    }
    if (driving === "Mostly city") {
      prioritySet.add("fuel-economy");
    }
    return Array.from(prioritySet);
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

    const preferencesPayload = {
      budgetLow,
      budgetHigh,
      bodyStyle: bodyStyle === "no-preference" ? null : bodyStyle,
      priorities: buildPriorities(),
    };

    const descriptionForAI = `From quiz: budget $${budgetLow.toLocaleString()}–$${budgetHigh.toLocaleString()}, new/used: ${newUsed}, preferred body style: ${bodyStyleLabel}, people: ${people}, cargo: ${cargo}, driving: ${driving}, weather: ${weather}, priorities: ${
      preferencesPayload.priorities.length
        ? preferencesPayload.priorities.join(", ")
        : "none specified"
    }`;

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
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {step + 1} of {totalSteps}</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} />
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What's your budget range?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBudget">Minimum budget ($)</Label>
                  <Input
                    id="minBudget"
                    type="number"
                    min={0}
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
                    min={0}
                    value={maxBudget}
                    onChange={(e) =>
                      setMaxBudget(e.target.value ? Number(e.target.value) : "")
                    }
                  />
                </div>
              </div>
              {!isStepValid && (
                <p className="text-sm text-destructive">
                  Enter a valid range where max is greater than min.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Are you shopping for:</h3>
              <div className="space-y-3">
                {["New only", "Used / certified pre-owned", "Either is fine"].map(
                  (option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        newUsed === option
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="newUsed"
                        value={option}
                        checked={newUsed === option}
                        onChange={() => setNewUsed(option)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          )}

          {step === 2 && (
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
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  How many people do you regularly drive?
                </h3>
                {["Just me", "2–3 people", "4–5 people", "Often more than 5"].map(
                  (option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        people === option
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="people"
                        value={option}
                        checked={people === option}
                        onChange={() => setPeople(option)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  )
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  How important is cargo space?
                </h3>
                {["Not important", "Nice to have", "Very important"].map(
                  (option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        cargo === option
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cargo"
                        value={option}
                        checked={cargo === option}
                        onChange={() => setCargo(option)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Where do you mostly drive?
                </h3>
                {["Mostly city", "Mostly highway", "A mix of both"].map(
                  (option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        driving === option
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="driving"
                        value={option}
                        checked={driving === option}
                        onChange={() => setDriving(option)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  )
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Do you regularly deal with snow, hills, or rough weather?
                </h3>
                {["Yes, often", "Occasionally", "Rarely / never"].map(
                  (option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        weather === option
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="weather"
                        value={option}
                        checked={weather === option}
                        onChange={() => setWeather(option)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          )}

          {step === 5 && (
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
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0 || isLoading}
            >
              Back
            </Button>
            <div className="flex items-center gap-3">
              {(step === 2 || step === 5) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip
                </Button>
              )}
              {step < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid || isLoading}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  {isLoading ? "Finding matches..." : "See my recommendations"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
