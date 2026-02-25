import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Car, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  DrivingMix,
  Priority,
  VehicleType,
  filterCars,
  formatCurrency,
  getAvailableFuelTypes,
  getAvailableVehicleTypes,
  getBudgetDefaults,
  parseCarsCsv,
  rankCars,
} from "@/lib/quizEngine";
import { toast } from "sonner";

const Quiz = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
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

  const noMatches = hasSubmitted && filteredCars.length === 0;

  const toggleVehicleType = (type: VehicleType) => {
    setSelectedVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const toggleFuelType = (fuelType: string) => {
    setSelectedFuelTypes((prev) =>
      prev.includes(fuelType)
        ? prev.filter((item) => item !== fuelType)
        : [...prev, fuelType],
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
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    if (!filteredCars.length) {
      return;
    }

    const rankedCars = rankCars(filteredCars, drivingMix, priority).slice(0, 10);
    const mpgLabel =
      drivingMix === "Mostly city"
        ? "city MPG"
        : drivingMix === "Mostly highway"
          ? "highway MPG"
          : "combined MPG";

    const recommendations = rankedCars.map((car) => ({
      make: car.make,
      model: car.model,
      year: car.year,
      type: car.vehicleClass,
      priceRange: formatCurrency(car.msrp),
      score: car.finalScore,
      fuelEconomy: `${Math.round(car.combinedMpg)} MPG combined`,
      safetyRating: null,
      reasons: [
        `Within your ${formatCurrency(budgetMin)}–${formatCurrency(budgetMax)} budget`,
        `${Math.round(drivingMix === "Mostly city" ? car.cityMpg : drivingMix === "Mostly highway" ? car.highwayMpg : car.combinedMpg)} ${mpgLabel}`,
        priority === "Balanced" ? "Strong overall balance across price, MPG, comfort and sportiness" : `Ranked high for ${priority.toLowerCase()}`,
      ],
      aiExplanation: `High match for ${priority.toLowerCase()} with strong ${mpgLabel.toLowerCase()} and fit in your selected budget.`,
    }));

    const userInput = `Guided quiz: ${formatCurrency(budgetMin)}-${formatCurrency(budgetMax)}, vehicle type ${selectedVehicleTypes.length ? selectedVehicleTypes.join(", ") : "No preference"}, fuel ${selectedFuelTypes.length ? selectedFuelTypes.join(", ") : "No preference"}, driving ${drivingMix}, priority ${priority}`;

    navigate("/results", {
      state: {
        recommendations,
        userInput,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="p-8 text-center">Loading guided quiz…</Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to free text input
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Guided Car Quiz
          </h1>
          <p className="text-lg text-muted-foreground">One quick screen to narrow options and rank the best matches.</p>
        </div>

        <Card className="p-8 shadow-lg space-y-8">
          <section className="space-y-4">
            <Label className="text-base font-semibold">Budget range</Label>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="budget-min" className="text-sm text-muted-foreground">Minimum</Label>
                <Slider
                  id="budget-min"
                  min={budgetBounds.min}
                  max={budgetBounds.max}
                  step={500}
                  value={[budgetMin]}
                  onValueChange={([value]) => setBudgetMin(Math.min(value, budgetMax))}
                  aria-label="Budget minimum"
                />
              </div>
              <div>
                <Label htmlFor="budget-max" className="text-sm text-muted-foreground">Maximum</Label>
                <Slider
                  id="budget-max"
                  min={budgetBounds.min}
                  max={budgetBounds.max}
                  step={500}
                  value={[budgetMax]}
                  onValueChange={([value]) => setBudgetMax(Math.max(value, budgetMin))}
                  aria-label="Budget maximum"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{formatCurrency(budgetMin)}</span> to <span className="font-medium text-foreground">{formatCurrency(budgetMax)}</span>
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-base font-semibold">Vehicle type</Label>
            <p className="text-sm text-muted-foreground">Leave empty for no preference.</p>
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
                    className="rounded-full"
                  >
                    {type}
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-base font-semibold">Fuel type</Label>
            <p className="text-sm text-muted-foreground">Leave empty for no preference.</p>
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
                    className="rounded-full"
                  >
                    {fuelType}
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-base font-semibold">Driving mix</Label>
            <div className="inline-flex rounded-lg border-2 border-border p-1 bg-muted/50" role="radiogroup" aria-label="Driving mix">
              {(["Mostly city", "Mostly highway", "Mix"] as DrivingMix[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={drivingMix === option}
                  onClick={() => setDrivingMix(option)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    drivingMix === option ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-base font-semibold">Priority</Label>
            <RadioGroup value={priority} onValueChange={(value) => setPriority(value as Priority)} className="grid md:grid-cols-2 gap-3">
              {(["Balanced", "Lowest price", "Best fuel economy", "Most comfortable", "Sportiest"] as Priority[]).map((option) => (
                <label key={option} htmlFor={`priority-${option.replace(/\s+/g, "-").toLowerCase()}`} className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:border-primary/50">
                  <RadioGroupItem value={option} id={`priority-${option.replace(/\s+/g, "-").toLowerCase()}`} />
                  <span className="text-sm font-medium">{option}</span>
                </label>
              ))}
            </RadioGroup>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-sm text-muted-foreground">
              {filteredCars.length > 0 ? <span>{filteredCars.length} matching vehicles before ranking</span> : <span>No current matches</span>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button type="button" onClick={handleSubmit} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                Get recommendations
              </Button>
            </div>
          </section>

          {noMatches && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <p className="font-medium mb-2">No cars match those hard filters.</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Widen your budget range.</li>
                <li>Select fewer vehicle types.</li>
                <li>Clear fuel-type filters or choose no preference.</li>
              </ul>
            </Card>
          )}

          {!noMatches && hasSubmitted && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">Top results are ranked by {priority.toLowerCase()}</Badge>
              <Badge variant="secondary">MPG metric: {drivingMix === "Mix" ? "combined" : drivingMix === "Mostly city" ? "city" : "highway"}</Badge>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
