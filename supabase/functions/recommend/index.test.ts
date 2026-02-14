import {
  computeCompositeScore,
  DEFAULT_WEIGHTS,
  getNormalizationBounds,
  resolveWeights,
} from "./index.ts";
import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const basePrefs = {
  budgetLow: 0,
  budgetHigh: 0,
  bodyStyle: null,
  priorities: [] as string[],
  comfort_weight: 0,
  sportiness_weight: 0,
  price_weight: 0,
  fuelTypeHint: null,
  drivetrainHint: null,
  transmissionHint: null,
  efficiencyHint: null as "high" | null,
};

const baseDerivedPreferences = {
  preferredFuelTypes: [] as string[],
  preferredDrives: [] as string[],
  preferredTransmissions: [] as string[],
  wantsFuelEconomy: false,
  wantsLowerEmissions: false,
};

Deno.test("comfort weighting favors more comfortable cars", () => {
  const cars = [
    {
      id: "comfy-a",
      make: "Comfy",
      model: "A",
      year: 2025,
      type: "Sedan",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 9,
      sportinessScore: 3,
      msrp: 40000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
    {
      id: "sporty-b",
      make: "Sporty",
      model: "B",
      year: 2025,
      type: "Coupe",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 4,
      sportinessScore: 9,
      msrp: 45000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
  ];
  const bounds = getNormalizationBounds(cars);
  const prefs = {
    ...basePrefs,
    comfort_weight: 1,
    sportiness_weight: 0,
    price_weight: 0,
  };
  const weights = resolveWeights(prefs);

  const comfyScore = computeCompositeScore(cars[0], bounds, weights, prefs, baseDerivedPreferences);
  const sportyScore = computeCompositeScore(cars[1], bounds, weights, prefs, baseDerivedPreferences);

  assert(comfyScore > sportyScore);
});

Deno.test("sportiness weighting favors sportier cars", () => {
  const cars = [
    {
      id: "comfy-a",
      make: "Comfy",
      model: "A",
      year: 2025,
      type: "Sedan",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 9,
      sportinessScore: 3,
      msrp: 40000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
    {
      id: "sporty-b",
      make: "Sporty",
      model: "B",
      year: 2025,
      type: "Coupe",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 4,
      sportinessScore: 9,
      msrp: 45000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
  ];
  const bounds = getNormalizationBounds(cars);
  const prefs = {
    ...basePrefs,
    comfort_weight: 0,
    sportiness_weight: 1,
    price_weight: 0,
  };
  const weights = resolveWeights(prefs);

  const comfyScore = computeCompositeScore(cars[0], bounds, weights, prefs, baseDerivedPreferences);
  const sportyScore = computeCompositeScore(cars[1], bounds, weights, prefs, baseDerivedPreferences);

  assert(sportyScore > comfyScore);
});

Deno.test("price weighting favors more affordable cars", () => {
  const cars = [
    {
      id: "budget-c",
      make: "Budget",
      model: "C",
      year: 2025,
      type: "Hatchback",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 5,
      sportinessScore: 5,
      msrp: 20000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
    {
      id: "premium-d",
      make: "Premium",
      model: "D",
      year: 2025,
      type: "SUV",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 7,
      sportinessScore: 6,
      msrp: 50000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
  ];
  const bounds = getNormalizationBounds(cars);
  const prefs = {
    ...basePrefs,
    comfort_weight: 0,
    sportiness_weight: 0,
    price_weight: 1,
  };
  const weights = resolveWeights(prefs);

  const budgetScore = computeCompositeScore(cars[0], bounds, weights, prefs, baseDerivedPreferences);
  const premiumScore = computeCompositeScore(cars[1], bounds, weights, prefs, baseDerivedPreferences);

  assert(budgetScore > premiumScore);
});

Deno.test("resolveWeights falls back to defaults when weights sum to zero", () => {
  const weights = resolveWeights(basePrefs);
  assertEquals(weights, DEFAULT_WEIGHTS);
});

Deno.test("high-budget users are less price-penalized and favor premium comfort/performance", () => {
  const cars = [
    {
      id: "value-e",
      make: "Value",
      model: "E",
      year: 2025,
      type: "Sedan",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 4,
      sportinessScore: 4,
      msrp: 45000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
    {
      id: "premium-f",
      make: "Premium",
      model: "F",
      year: 2025,
      type: "Sedan",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: 9,
      sportinessScore: 9,
      msrp: 90000,
      drive: null,
      fuelType: null,
      vehicleClass: null,
    },
  ];
  const bounds = getNormalizationBounds(cars);

  const lowBudgetPrefs = {
    ...basePrefs,
    budgetLow: 30000,
    budgetHigh: 45000,
    comfort_weight: 0.2,
    sportiness_weight: 0.2,
    price_weight: 0.4,
    budget_weight: 0.2,
  };
  const highBudgetPrefs = {
    ...basePrefs,
    budgetLow: 60000,
    budgetHigh: 90000,
    comfort_weight: 0.2,
    sportiness_weight: 0.2,
    price_weight: 0.4,
    budget_weight: 0.2,
  };

  const lowBudgetWeights = resolveWeights(lowBudgetPrefs);
  const highBudgetWeights = resolveWeights(highBudgetPrefs);

  const lowBudgetValueScore = computeCompositeScore(
    cars[0],
    bounds,
    lowBudgetWeights,
    lowBudgetPrefs,
    baseDerivedPreferences,
  );
  const lowBudgetPremiumScore = computeCompositeScore(
    cars[1],
    bounds,
    lowBudgetWeights,
    lowBudgetPrefs,
    baseDerivedPreferences,
  );
  assert(lowBudgetValueScore > lowBudgetPremiumScore);

  const highBudgetValueScore = computeCompositeScore(
    cars[0],
    bounds,
    highBudgetWeights,
    highBudgetPrefs,
    baseDerivedPreferences,
  );
  const highBudgetPremiumScore = computeCompositeScore(
    cars[1],
    bounds,
    highBudgetWeights,
    highBudgetPrefs,
    baseDerivedPreferences,
  );
  assert(highBudgetPremiumScore > highBudgetValueScore);
});
