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
  priorities: [],
  comfort_weight: 0,
  sportiness_weight: 0,
  price_weight: 0,
};

Deno.test("comfort weighting favors more comfortable cars", () => {
  const cars = [
    {
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
    },
    {
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
    },
  ];
  const bounds = getNormalizationBounds(cars);
  const weights = resolveWeights({
    ...basePrefs,
    comfort_weight: 1,
    sportiness_weight: 0,
    price_weight: 0,
  });

  const comfyScore = computeCompositeScore(cars[0], bounds, weights);
  const sportyScore = computeCompositeScore(cars[1], bounds, weights);

  assert(comfyScore > sportyScore);
});

Deno.test("sportiness weighting favors sportier cars", () => {
  const cars = [
    {
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
    },
    {
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
    },
  ];
  const bounds = getNormalizationBounds(cars);
  const weights = resolveWeights({
    ...basePrefs,
    comfort_weight: 0,
    sportiness_weight: 1,
    price_weight: 0,
  });

  const comfyScore = computeCompositeScore(cars[0], bounds, weights);
  const sportyScore = computeCompositeScore(cars[1], bounds, weights);

  assert(sportyScore > comfyScore);
});

Deno.test("price weighting favors more affordable cars", () => {
  const cars = [
    {
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
    },
    {
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
    },
  ];
  const bounds = getNormalizationBounds(cars);
  const weights = resolveWeights({
    ...basePrefs,
    comfort_weight: 0,
    sportiness_weight: 0,
    price_weight: 1,
  });

  const budgetScore = computeCompositeScore(cars[0], bounds, weights);
  const premiumScore = computeCompositeScore(cars[1], bounds, weights);

  assert(budgetScore > premiumScore);
});

Deno.test("resolveWeights falls back to defaults when weights sum to zero", () => {
  const weights = resolveWeights(basePrefs);
  assertEquals(weights, DEFAULT_WEIGHTS);
});
