import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  DrivingMix,
  Priority,
  VehicleType,
  filterCars,
  formatCurrency,
  getAvailableFuelTypes,
  getMpgMetric,
  getAvailableVehicleTypes,
  getBudgetDefaults,
  parseCarsCsv,
  rankCars,
} from "@/lib/quizEngine";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const priorityOptions: { value: Priority; label: string; desc: string }[] = [
  { value: "Balanced", label: "Balanced", desc: "Best overall mix of price, MPG, comfort & performance" },
  { value: "Lowest price", label: "Lowest price", desc: "Prioritize the most affordable options" },
  { value: "Best fuel economy", label: "Best fuel economy", desc: "Maximize miles per gallon" },
  { value: "Most comfortable", label: "Most comfortable", desc: "Emphasize ride quality and comfort features" },
  { value: "Sportiest", label: "Sportiest", desc: "Emphasize driving dynamics and performance" },
];

const drivingMixOptions: { value: DrivingMix; label: string; desc: string }[] = [
  { value: "Mostly city", label: "Mostly city", desc: "Stop-and-go, short trips, urban driving" },
  { value: "Mostly highway", label: "Mostly highway", desc: "Long commutes, road trips, steady speed" },
  { value: "Mix", label: "Mix of both", desc: "A balanced blend of city and highway" },
];

const STEPS = ["Budget", "Vehicle & Fuel", "Driving", "Priority"] as const;

const QUIZ_VEHICLE_TYPE_BODY_STYLE_MAP: Record<VehicleType, string[]> = {
  Sedan: ["sedan", "compact car", "midsize car", "subcompact car", "wagon"],
  SUV: ["suv", "sport utility", "crossover"],
  Hatchback: ["hatchback"],
  Coupe: ["coupe", "two seater", "convertible", "roadster"],
  Truck: ["truck", "pickup", "pick-up"],
  Other: [],
};

const getBodyStyleHints = (vehicleTypes: VehicleType[]) => {
  return Array.from(
    new Set(vehicleTypes.flatMap((vehicleType) => QUIZ_VEHICLE_TYPE_BODY_STYLE_MAP[vehicleType] ?? [])),
  );
};

const getPriorityReason = (priority: Priority, vehicle: string) => {
  switch (priority) {
    case "Lowest price":
      return `Keeps costs down with a competitive MSRP for a ${vehicle.toLowerCase()}`;
    case "Best fuel economy":
      return "Delivers strong fuel economy for daily driving";
    case "Most comfortable":
      return "Stands out for ride comfort and everyday refinement";
    case "Sportiest":
      return "Feels more engaging and responsive than most alternatives";
    case "Balanced":
    default:
      return "Balances price, efficiency, comfort, and performance well";
  }
};

const buildLocalRecommendations = (
  cars: ReturnType<typeof parseCarsCsv>,
  drivingMix: DrivingMix,
  priority: Priority,
) => {
  return rankCars(cars, drivingMix, priority)
    .slice(0, 3)
    .map((car) => {
      const mpgMetric = getMpgMetric(car, drivingMix);
      const reasons = [
        getPriorityReason(priority, car.vehicleTypeBucket),
        `${formatCurrency(car.msrp)} MSRP`,
        `${Math.round(mpgMetric.value)} ${mpgMetric.label}`,
      ];

      return {
        make: car.make,
        model: car.model,
        year: car.year,
        priceRange: `${formatCurrency(car.msrp)} MSRP`,
        reasons,
        score: car.finalScore,
        fuelEconomy: `${Math.round(car.combinedMpg)} combined MPG`,
        type: car.vehicleClass || car.vehicleTypeBucket,
        aiExplanation: undefined,
      };
    });
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
    if (!filteredCars.length) return;

    const bodyStyles = getBodyStyleHints(selectedVehicleTypes);
    const vehicleTypeSummary = selectedVehicleTypes.length ? selectedVehicleTypes.join(", ") : "No preference";
    const bodyStyleSummary = bodyStyles.length ? ` (${bodyStyles.join(", ")})` : "";
    const userInput = `Guided quiz: ${formatCurrency(budgetMin)}-${formatCurrency(budgetMax)}, vehicle type ${vehicleTypeSummary}${bodyStyleSummary}, fuel ${selectedFuelTypes.length ? selectedFuelTypes.join(", ") : "No preference"}, driving ${drivingMix}, priority ${priority}`;

    const priorities = [priority.toLowerCase()];
    if (drivingMix !== "Mix") {
      priorities.push("fuel economy");
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.functions.invoke("recommend", {
        body: {
          userInput,
          preferences: {
            budgetLow: budgetMin,
            budgetHigh: budgetMax,
            bodyStyle: bodyStyles[0] ?? null,
            bodyStyles,
            priorities,
            comfort_weight: priority === "Most comfortable" ? 2 : 1,
            sportiness_weight: priority === "Sportiest" ? 2 : 1,
            price_weight: priority === "Lowest price" ? 2 : 1,
            fuelTypeHint: selectedFuelTypes[0] ?? null,
            drivetrainHint: null,
            transmissionHint: null,
            efficiencyHint: priority === "Best fuel economy" ? "high" : null,
          },
        },
      });

      if (error) {
        throw error;
      }

      const recommendations = data?.recommendations;
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error("No recommendations returned");
      }

      navigate("/results", { state: { recommendations, userInput } });
    } catch (error) {
      console.error("Failed to fetch recommendations", error);

      const fallbackRecommendations = buildLocalRecommendations(filteredCars, drivingMix, priority);
      if (!fallbackRecommendations.length) {
        toast.error("Couldn't fetch AI recommendations. Please try again.");
        return;
      }

      toast.warning("AI recommendations are unavailable right now, so we showed the best local matches instead.");
      navigate("/results", { state: { recommendations: fallbackRecommendations, userInput } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading quiz…</p>
        </div>
      </div>
    );
  }

  const noMatches = hasSubmitted && filteredCars.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => currentStep > 0 ? setCurrentStep((s) => s - 1) : navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep > 0 ? "Back" : "Home"}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
            <span className="font-medium">Step {currentStep + 1} of {STEPS.length}</span>
            <span>{STEPS[currentStep]}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Steps */}
        <div className="animate-fade-in" key={currentStep}>
          {/* Step 0: Budget */}
          {currentStep === 0 && (
            <section className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">What's your budget?</h2>
                <p className="text-muted-foreground">Set your comfortable price range.</p>
              </div>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Minimum</span>
                    <span className="text-lg font-semibold text-foreground">{formatCurrency(budgetMin)}</span>
                  </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Maximum</span>
                    <span className="text-lg font-semibold text-foreground">{formatCurrency(budgetMax)}</span>
                  </div>
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
              <div className="text-center text-sm text-muted-foreground pt-2">
                {filteredCars.length} cars in this range
              </div>
            </section>
          )}

          {/* Step 1: Vehicle & Fuel */}
          {currentStep === 1 && (
            <section className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">What type of car?</h2>
                <p className="text-muted-foreground">Select any that interest you, or skip for all.</p>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Vehicle type</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableVehicleTypes.map((type) => {
                      const selected = selectedVehicleTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleVehicleType(type)}
                          aria-pressed={selected}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium border transition-all ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary shadow-card"
                              : "bg-card text-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Fuel type</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableFuelTypes.map((fuelType) => {
                      const selected = selectedFuelTypes.includes(fuelType);
                      return (
                        <button
                          key={fuelType}
                          type="button"
                          onClick={() => toggleFuelType(fuelType)}
                          aria-pressed={selected}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium border transition-all ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary shadow-card"
                              : "bg-card text-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                          {fuelType}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground pt-2">
                {filteredCars.length} matches
              </div>
            </section>
          )}

          {/* Step 2: Driving */}
          {currentStep === 2 && (
            <section className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">How do you drive?</h2>
                <p className="text-muted-foreground">This helps us pick the right efficiency metric.</p>
              </div>
              <div className="space-y-3">
                {drivingMixOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDrivingMix(option.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      drivingMix === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 bg-card"
                    }`}
                  >
                    <div className="font-medium text-foreground">{option.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{option.desc}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Step 3: Priority */}
          {currentStep === 3 && (
            <section className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">What matters most?</h2>
                <p className="text-muted-foreground">We'll weight your results accordingly.</p>
              </div>
              <div className="space-y-3">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      priority === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 bg-card"
                    }`}
                  >
                    <div className="font-medium text-foreground">{option.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{option.desc}</div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* No matches warning */}
        {noMatches && currentStep === 3 && (
          <div className="mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5 animate-fade-in">
            <p className="font-medium text-foreground mb-2">No cars match those filters.</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Widen your budget range</li>
              <li>Select fewer vehicle types</li>
              <li>Clear fuel-type filters</li>
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-end mt-10 pt-6 border-t border-border">
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="px-6"
            >
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="px-8"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Generating recommendations..." : "Get recommendations"}
              {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
