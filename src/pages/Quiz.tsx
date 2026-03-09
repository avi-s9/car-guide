import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  DrivingMix,
  Priority,
  VehicleType,
  bucketVehicleClass,
  filterCars,
  getFuelTypeCategory,
  formatCurrency,
  getAvailableFuelTypes,
  getAvailableVehicleTypes,
  getBudgetDefaults,
  getMpgMetric,
  parseCarsCsv,
  rankCars,
} from "@/lib/quizEngine";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const priorityOptions: Priority[] = [
  "Balanced",
  "Lowest price",
  "Best fuel economy",
  "Most comfortable",
  "Sportiest",
];

const priorityTagMap: Record<Priority, string[]> = {
  Balanced: [],
  "Lowest price": [],
  "Best fuel economy": ["fuel-economy"],
  "Most comfortable": ["safe"],
  Sportiest: ["fun-to-drive"],
};

const priorityWeightMap: Record<Priority, { price: number; mpg: number; comfort: number; sporty: number }> = {
  Balanced: { price: 0.3, mpg: 0.25, comfort: 0.25, sporty: 0.2 },
  "Lowest price": { price: 0.6, mpg: 0.15, comfort: 0.15, sporty: 0.1 },
  "Best fuel economy": { price: 0.15, mpg: 0.6, comfort: 0.15, sporty: 0.1 },
  "Most comfortable": { price: 0.15, mpg: 0.15, comfort: 0.6, sporty: 0.1 },
  Sportiest: { price: 0.15, mpg: 0.15, comfort: 0.1, sporty: 0.6 },
};

const drivingMixOptions: DrivingMix[] = ["Mostly city", "Mostly highway", "Mix"];

const backendBodyStyleMap: Record<VehicleType, string[]> = {
  Sedan: ["Cars", "Sedan", "Wagons"],
  SUV: ["SUV"],
  Hatchback: ["Hatchback", "Subcompact Cars", "Compact Cars"],
  Coupe: ["Two Seaters", "Coupe"],
  Truck: ["Pick-up Trucks", "Truck"],
  Other: [],
};

const STEPS = ["Budget", "Vehicle & Fuel", "Driving", "Priority"] as const;

const extractRecommendationMsrp = (recommendation: { msrp?: unknown; priceRange?: unknown }) => {
  if (typeof recommendation.msrp === "number" && Number.isFinite(recommendation.msrp)) {
    return recommendation.msrp;
  }

  if (typeof recommendation.priceRange !== "string") {
    return null;
  }

  const firstMoneyLikeValue = recommendation.priceRange.match(/\d[\d,]*(?:\.\d+)?/);
  if (!firstMoneyLikeValue) {
    return null;
  }

  const numericPrice = Number(firstMoneyLikeValue[0].replace(/,/g, ""));
  return Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : null;
};

const Quiz = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cars, setCars] = useState<ReturnType<typeof parseCarsCsv>>([]);
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(0);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [drivingMix, setDrivingMix] = useState<DrivingMix>("Mix");
  const [priority, setPriority] = useState<Priority>("Balanced");

  useEffect(() => {
    const loadCars = async () => {
      try {
        const response = await fetch("/data/cars_2025_enriched_complete.csv");
        if (!response.ok) throw new Error(`Failed to load data: ${response.status}`);
        const csvText = await response.text();
        const parsedCars = parseCarsCsv(csvText);
        const defaults = getBudgetDefaults(parsedCars);
        setCars(parsedCars);
        setBudgetMin(defaults.defaultMin);
        setBudgetMax(defaults.defaultMax);
      } catch (error) {
        console.error("Failed loading quiz dataset", error);
        toast.error("Unable to load car dataset. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadCars();
  }, []);

  const budgetBounds = useMemo(() => getBudgetDefaults(cars), [cars]);
  const availableVehicleTypes = useMemo(() => getAvailableVehicleTypes(cars), [cars]);
  const availableFuelTypes = useMemo(() => getAvailableFuelTypes(cars), [cars]);

  const filteredCars = useMemo(
    () => filterCars(cars, budgetMin, budgetMax, selectedVehicleTypes, selectedFuelTypes),
    [cars, budgetMin, budgetMax, selectedVehicleTypes, selectedFuelTypes],
  );

  const toggleVehicleType = (type: VehicleType) => {
    setSelectedVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const toggleFuelType = (fuelType: string) => {
    setSelectedFuelTypes((prev) =>
      prev.includes(fuelType) ? prev.filter((item) => item !== fuelType) : [...prev, fuelType],
    );
  };

  const handleReset = () => {
    setBudgetMin(budgetBounds.defaultMin);
    setBudgetMax(budgetBounds.defaultMax);
    setSelectedVehicleTypes([]);
    setSelectedFuelTypes([]);
    setDrivingMix("Mix");
    setPriority("Balanced");
    setHasSubmitted(false);
    setCurrentStep(0);
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);
    if (!filteredCars.length) {
      return;
    }

    setIsSubmitting(true);

    const userInput = `Guided quiz: ${formatCurrency(budgetMin)}-${formatCurrency(budgetMax)}, vehicle type ${selectedVehicleTypes.length ? selectedVehicleTypes.join(", ") : "No preference"}, fuel ${selectedFuelTypes.length ? selectedFuelTypes.join(", ") : "No preference"}, driving ${drivingMix}, priority ${priority}`;

    const selectedPrimaryBodyStyle = selectedVehicleTypes.length === 1
      ? backendBodyStyleMap[selectedVehicleTypes[0]][0] ?? null
      : null;


    const priorityTags: string[] = [...priorityTagMap[priority]];
    if (drivingMix === "Mostly city") {
      priorityTags.push("fuel-economy");
    }

    const selectedWeights = priorityWeightMap[priority];

    try {
      const { data, error } = await supabase.functions.invoke("recommend", {
        body: {
          preferences: {
            budgetLow: budgetMin,
            budgetHigh: budgetMax,
            bodyStyle: selectedPrimaryBodyStyle,
            priorities: priorityTags,
            comfort_weight: selectedWeights.comfort,
            sportiness_weight: selectedWeights.sporty,
            price_weight: selectedWeights.price,
            mpg_weight: selectedWeights.mpg,
          },
          userInput,
        },
      });

      if (error) {
        throw error;
      }

      const recommendations = data?.recommendations;
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error("No recommendations returned from backend");
      }

      const filteredRecommendations = recommendations.filter((recommendation) => {
        const recommendationType = typeof recommendation?.type === "string" ? recommendation.type : "";
        const recommendationBucket = bucketVehicleClass(recommendationType);
        const recommendationFuelType = typeof recommendation?.fuelType === "string" ? recommendation.fuelType : "";
        const recommendationFuelCategory = getFuelTypeCategory(recommendationFuelType);
        const recommendationMsrp = extractRecommendationMsrp(recommendation);

        const vehicleTypeMatches = selectedVehicleTypes.length === 0 ||
          selectedVehicleTypes.includes(recommendationBucket);
        const fuelTypeMatches = selectedFuelTypes.length === 0 ||
          selectedFuelTypes.includes(recommendationFuelCategory);
        const budgetMatches = recommendationMsrp !== null &&
          recommendationMsrp >= budgetMin &&
          recommendationMsrp <= budgetMax;

        return vehicleTypeMatches && fuelTypeMatches && budgetMatches;
      });

      if (!filteredRecommendations.length) {
        throw new Error("No backend recommendations matched selected budget, vehicle, or fuel-type filters");
      }

      navigate("/results", { state: { recommendations: filteredRecommendations, userInput } });
      return;
    } catch (error) {
      console.error("Recommend function failed, falling back to local ranking:", error);
      toast.warning("Live AI explanations are temporarily unavailable. Showing local matches.");
    } finally {
      setIsSubmitting(false);
    }

    const rankedCars = rankCars(filteredCars, drivingMix, priority).slice(0, 10);
    const recommendations = rankedCars.map((car) => {
      const mpgMetric = getMpgMetric(car, drivingMix);
      return {
        make: car.make,
        model: car.model,
        year: car.year,
        type: car.vehicleClass,
        priceRange: formatCurrency(car.msrp),
        score: car.finalScore,
        fuelEconomy: `${Math.round(mpgMetric.value)} ${mpgMetric.label}`,
        safetyRating: null,
        reasons: [
          `Within your ${formatCurrency(budgetMin)}–${formatCurrency(budgetMax)} budget`,
          `${Math.round(mpgMetric.value)} ${mpgMetric.label}`,
          priority === "Balanced"
            ? "Strong overall balance across price, MPG, comfort and sportiness"
            : `Ranked high for ${priority.toLowerCase()}`,
        ],
      };
    });

    navigate("/results", { state: { recommendations, userInput } });
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md w-full">
          <p className="text-muted-foreground">Loading quiz…</p>
        </Card>
      </div>
    );
  }

  const noMatches = hasSubmitted && filteredCars.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{STEPS[currentStep]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 md:p-10 shadow-lg border-border/60">
          {/* Step 0: Budget */}
          {currentStep === 0 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">What's your budget?</h2>
                <p className="text-muted-foreground">Set your comfortable price range.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">
                    Minimum: <span className="font-semibold text-foreground">{formatCurrency(budgetMin)}</span>
                  </Label>
                  <Slider
                    min={budgetBounds.min}
                    max={budgetBounds.max}
                    step={500}
                    value={[budgetMin]}
                    onValueChange={([value]) => setBudgetMin(Math.min(value, budgetMax))}
                    aria-label="Budget minimum"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">
                    Maximum: <span className="font-semibold text-foreground">{formatCurrency(budgetMax)}</span>
                  </Label>
                  <Slider
                    min={budgetBounds.min}
                    max={budgetBounds.max}
                    step={500}
                    value={[budgetMax]}
                    onValueChange={([value]) => setBudgetMax(Math.max(value, budgetMin))}
                    aria-label="Budget maximum"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Step 1: Vehicle & Fuel */}
          {currentStep === 1 && (
            <section className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Vehicle & fuel type</h2>
                <p className="text-muted-foreground">Select any that interest you, or skip for no preference.</p>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Vehicle type</Label>
                <div className="flex flex-wrap gap-2">
                  {availableVehicleTypes.map((type) => {
                    const selected = selectedVehicleTypes.includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        onClick={() => toggleVehicleType(type)}
                        aria-pressed={selected}
                        className="rounded-full px-5 py-2.5 text-sm"
                      >
                        {type}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Fuel type</Label>
                <div className="flex flex-wrap gap-2">
                  {availableFuelTypes.map((fuelType) => {
                    const selected = selectedFuelTypes.includes(fuelType);
                    return (
                      <Button
                        key={fuelType}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        onClick={() => toggleFuelType(fuelType)}
                        aria-pressed={selected}
                        className="rounded-full px-5 py-2.5 text-sm"
                      >
                        {fuelType}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Step 2: Driving */}
          {currentStep === 2 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">How do you drive?</h2>
                <p className="text-muted-foreground">This helps us pick the right MPG metric.</p>
              </div>
              <div className="flex flex-col gap-3">
                {drivingMixOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDrivingMix(option)}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      drivingMix === option
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Step 3: Priority */}
          {currentStep === 3 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">What matters most?</h2>
                <p className="text-muted-foreground">We'll weight your results accordingly.</p>
              </div>
              <RadioGroup
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
                className="flex flex-col gap-3"
              >
                {priorityOptions.map((option) => (
                  <label
                    key={option}
                    htmlFor={`priority-${option.replace(/\s+/g, "-").toLowerCase()}`}
                    className={`flex items-center gap-3 rounded-xl border-2 px-5 py-4 cursor-pointer transition-all ${
                      priority === option
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem
                      value={option}
                      id={`priority-${option.replace(/\s+/g, "-").toLowerCase()}`}
                    />
                    <span className="text-sm font-medium">{option}</span>
                  </label>
                ))}
              </RadioGroup>
            </section>
          )}

          {/* No matches warning */}
          {noMatches && currentStep === 3 && (
            <Card className="mt-6 p-4 border-destructive/50 bg-destructive/5">
              <p className="font-medium mb-2">No cars match those filters.</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Widen your budget range.</li>
                <li>Select fewer vehicle types.</li>
                <li>Clear fuel-type filters.</li>
              </ul>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/60">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {currentStep < STEPS.length - 1 && (
                <>
                  <span className="text-xs text-muted-foreground">{filteredCars.length} matches</span>
                  <Button onClick={() => setCurrentStep((s) => s + 1)}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity px-6">
                    Next
                  </Button>
                </>
              )}
              {currentStep === STEPS.length - 1 && (
                <Button onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity px-8">
                  {isSubmitting ? "Getting recommendations..." : "Get recommendations"}
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
