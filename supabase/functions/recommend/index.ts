import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Preferences {
  budgetLow: number;
  budgetHigh: number;
  bodyStyle: string | null;
  priorities: string[];
  comfort_weight: number;
  sportiness_weight: number;
  price_weight: number;
  budget_weight?: number;
  fuel_type_weight?: number;
  drive_weight?: number;
  transmission_weight?: number;
  mpg_weight?: number;
  emissions_weight?: number;
}

interface CarRow {
  id: string;
  year: number;
  make: string;
  model: string;
  vehicle_class: string | null;
  fuel_type: string | null;
  drive: string | null;
  transmission: string | null;
  city_mpg: number | null;
  highway_mpg: number | null;
  combined_mpg: number | null;
  co2_gpm: number | null;
  msrp: number | null;
  comfortScore: number | null;
  sportinessScore: number | null;
}

interface ScoredCar {
  make: string;
  model: string;
  year: number;
  type: string;
  priceRange: string;
  fuelEconomy: string;
  safetyRating?: number | null;
  score: number;
  reasons: string[];
  aiExplanation?: string;
  msrp?: number | null;
  comfortScore?: number | null;
  sportinessScore?: number | null;
  transmission?: string | null;
  cityMpg?: number | null;
  highwayMpg?: number | null;
  combinedMpg?: number | null;
  co2Gpm?: number | null;
}

type CandidateCar = ScoredCar & {
  drive?: string | null;
  fuelType?: string | null;
  tags: string[];
  vehicleClass?: string | null;
};

interface ScoreWeights {
  comfort_weight: number;
  sportiness_weight: number;
  price_weight: number;
  budget_weight: number;
  fuel_type_weight: number;
  drive_weight: number;
  transmission_weight: number;
  mpg_weight: number;
  emissions_weight: number;
}

interface NormalizationBounds {
  minComfort: number;
  maxComfort: number;
  minSportiness: number;
  maxSportiness: number;
  minMsrp: number;
  maxMsrp: number;
  minCombinedMpg: number;
  maxCombinedMpg: number;
  minCo2Gpm: number;
  maxCo2Gpm: number;
}

interface DerivedPreferences {
  preferredFuelTypes: string[];
  preferredDrives: string[];
  preferredTransmissions: string[];
  wantsFuelEconomy: boolean;
  wantsLowerEmissions: boolean;
}

const normalizeValue = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

const DEFAULT_WEIGHTS: ScoreWeights = {
  comfort_weight: 0.2,
  sportiness_weight: 0.2,
  price_weight: 0.15,
  budget_weight: 0.1,
  fuel_type_weight: 0.1,
  drive_weight: 0.1,
  transmission_weight: 0.05,
  mpg_weight: 0.05,
  emissions_weight: 0.05,
};

const resolveWeights = (prefs: Preferences): ScoreWeights => {
  const comfort = prefs.comfort_weight ?? DEFAULT_WEIGHTS.comfort_weight;
  const sportiness = prefs.sportiness_weight ?? DEFAULT_WEIGHTS.sportiness_weight;
  const price = prefs.price_weight ?? DEFAULT_WEIGHTS.price_weight;
  const budget = prefs.budget_weight ?? DEFAULT_WEIGHTS.budget_weight;
  const fuelType = prefs.fuel_type_weight ?? DEFAULT_WEIGHTS.fuel_type_weight;
  const drive = prefs.drive_weight ?? DEFAULT_WEIGHTS.drive_weight;
  const transmission = prefs.transmission_weight ?? DEFAULT_WEIGHTS.transmission_weight;
  const mpg = prefs.mpg_weight ?? DEFAULT_WEIGHTS.mpg_weight;
  const emissions = prefs.emissions_weight ?? DEFAULT_WEIGHTS.emissions_weight;
  const total =
    comfort +
    sportiness +
    price +
    budget +
    fuelType +
    drive +
    transmission +
    mpg +
    emissions;

  if (!Number.isFinite(total) || total <= 0) {
    return { ...DEFAULT_WEIGHTS };
  }

  return {
    comfort_weight: comfort / total,
    sportiness_weight: sportiness / total,
    price_weight: price / total,
    budget_weight: budget / total,
    fuel_type_weight: fuelType / total,
    drive_weight: drive / total,
    transmission_weight: transmission / total,
    mpg_weight: mpg / total,
    emissions_weight: emissions / total,
  };
};

const getNormalizationBounds = (cars: CandidateCar[]): NormalizationBounds => {
  const comfortValues = cars
    .map((car) => car.comfortScore)
    .filter((value): value is number => typeof value === "number");
  const sportinessValues = cars
    .map((car) => car.sportinessScore)
    .filter((value): value is number => typeof value === "number");
  const msrpValues = cars
    .map((car) => car.msrp)
    .filter((value): value is number => typeof value === "number");
  const combinedMpgValues = cars
    .map((car) => car.combinedMpg)
    .filter((value): value is number => typeof value === "number");
  const co2Values = cars
    .map((car) => car.co2Gpm)
    .filter((value): value is number => typeof value === "number");

  const minComfort = comfortValues.length ? Math.min(...comfortValues) : 1;
  const maxComfort = comfortValues.length ? Math.max(...comfortValues) : 10;
  const minSportiness = sportinessValues.length ? Math.min(...sportinessValues) : 1;
  const maxSportiness = sportinessValues.length ? Math.max(...sportinessValues) : 10;
  const minMsrp = msrpValues.length ? Math.min(...msrpValues) : 0;
  const maxMsrp = msrpValues.length ? Math.max(...msrpValues) : 0;
  const minCombinedMpg = combinedMpgValues.length ? Math.min(...combinedMpgValues) : 0;
  const maxCombinedMpg = combinedMpgValues.length ? Math.max(...combinedMpgValues) : 0;
  const minCo2Gpm = co2Values.length ? Math.min(...co2Values) : 0;
  const maxCo2Gpm = co2Values.length ? Math.max(...co2Values) : 0;

  return {
    minComfort,
    maxComfort,
    minSportiness,
    maxSportiness,
    minMsrp,
    maxMsrp,
    minCombinedMpg,
    maxCombinedMpg,
    minCo2Gpm,
    maxCo2Gpm,
  };
};

const normalizeRange = (value: number, min: number, max: number, fallback = 0.5) => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return fallback;
  }
  if (max === min) {
    return fallback;
  }
  return (value - min) / (max - min);
};

const clampScore = (value: number) => Math.min(1, Math.max(0, value));

const deriveUserPreferences = (prefs: Preferences): DerivedPreferences => {
  const priorities = new Set(prefs.priorities.map((priority) => normalizeValue(priority)));
  const wantsFuelEconomy =
    priorities.has("fuel-economy") || priorities.has("ev") || priorities.has("hybrid");
  const wantsLowerEmissions = wantsFuelEconomy;

  const preferredFuelTypes: string[] = [];
  if (priorities.has("ev")) {
    preferredFuelTypes.push("electricity", "electric");
  }
  if (priorities.has("hybrid") || priorities.has("fuel-economy")) {
    preferredFuelTypes.push("hybrid");
  }
  if (wantsFuelEconomy && preferredFuelTypes.length === 0) {
    preferredFuelTypes.push("hybrid", "electricity", "electric");
  }

  const preferredDrives: string[] = [];
  if (priorities.has("all-wheel-drive")) {
    preferredDrives.push("awd", "4wd", "4x4");
  }

  const preferredTransmissions: string[] = [];
  if (priorities.has("fun-to-drive")) {
    preferredTransmissions.push("manual", "automated manual", "dual-clutch");
  }

  return {
    preferredFuelTypes,
    preferredDrives,
    preferredTransmissions,
    wantsFuelEconomy,
    wantsLowerEmissions,
  };
};

const scoreFieldMatch = (
  value: string | null | undefined,
  preferredValues: string[],
  fallback = 0.5,
) => {
  if (preferredValues.length === 0) {
    return fallback;
  }
  if (!value) {
    return 0.35;
  }
  const normalized = normalizeValue(value);
  const matched = preferredValues.some((preferred) => normalized.includes(preferred));
  return matched ? 1 : 0;
};

const scoreBudgetFit = (msrp: number | null | undefined, prefs: Preferences) => {
  const budgetLow = prefs.budgetLow ?? 0;
  const budgetHigh = prefs.budgetHigh ?? 0;

  if (!budgetLow && !budgetHigh) {
    return 0.5;
  }
  if (typeof msrp !== "number" || !Number.isFinite(msrp)) {
    return 0.4;
  }

  const low = Math.min(budgetLow, budgetHigh || budgetLow);
  const high = Math.max(budgetLow, budgetHigh || budgetLow);

  if (low > 0 && high > 0) {
    if (msrp >= low && msrp <= high) {
      return 1;
    }
    const range = Math.max(high - low, low || high || 1);
    const distance = msrp < low ? low - msrp : msrp - high;
    return clampScore(1 - distance / range);
  }

  if (low > 0) {
    if (msrp >= low) {
      return 1;
    }
    return clampScore(1 - (low - msrp) / low);
  }

  if (high > 0) {
    if (msrp <= high) {
      return 1;
    }
    return clampScore(1 - (msrp - high) / high);
  }

  return 0.5;
};

const computeNormalizedScores = (
  car: CandidateCar,
  bounds: NormalizationBounds,
  prefs: Preferences,
  derivedPreferences: DerivedPreferences,
) => {
  const normalizedComfort =
    typeof car.comfortScore === "number"
      ? normalizeRange(car.comfortScore, bounds.minComfort, bounds.maxComfort)
      : 0.5;
  const normalizedSportiness =
    typeof car.sportinessScore === "number"
      ? normalizeRange(
        car.sportinessScore,
        bounds.minSportiness,
        bounds.maxSportiness,
      )
      : 0.5;

  let normalizedAffordability = 0.5;
  if (typeof car.msrp === "number") {
    const normalizedPrice = normalizeRange(car.msrp, bounds.minMsrp, bounds.maxMsrp);
    normalizedAffordability = 1 - normalizedPrice;
  }

  const normalizedBudgetFit = scoreBudgetFit(car.msrp, prefs);
  const normalizedFuelType = scoreFieldMatch(
    car.fuelType,
    derivedPreferences.preferredFuelTypes,
  );
  const normalizedDrive = scoreFieldMatch(
    car.drive,
    derivedPreferences.preferredDrives,
  );
  const normalizedTransmission = scoreFieldMatch(
    car.transmission,
    derivedPreferences.preferredTransmissions,
  );
  const normalizedCombinedMpg = derivedPreferences.wantsFuelEconomy
    ? typeof car.combinedMpg === "number"
      ? normalizeRange(car.combinedMpg, bounds.minCombinedMpg, bounds.maxCombinedMpg)
      : 0.35
    : 0.5;
  const normalizedCo2Gpm = derivedPreferences.wantsLowerEmissions
    ? typeof car.co2Gpm === "number"
      ? 1 - normalizeRange(car.co2Gpm, bounds.minCo2Gpm, bounds.maxCo2Gpm)
      : 0.35
    : 0.5;

  return {
    normalizedComfort,
    normalizedSportiness,
    normalizedAffordability,
    normalizedBudgetFit,
    normalizedFuelType,
    normalizedDrive,
    normalizedTransmission,
    normalizedCombinedMpg,
    normalizedCo2Gpm,
  };
};

const computeCompositeScore = (
  car: CandidateCar,
  bounds: NormalizationBounds,
  weights: ScoreWeights,
  prefs: Preferences,
  derivedPreferences: DerivedPreferences,
) => {
  const {
    normalizedComfort,
    normalizedSportiness,
    normalizedAffordability,
    normalizedBudgetFit,
    normalizedFuelType,
    normalizedDrive,
    normalizedTransmission,
    normalizedCombinedMpg,
    normalizedCo2Gpm,
  } = computeNormalizedScores(car, bounds, prefs, derivedPreferences);

  return (
    weights.comfort_weight * normalizedComfort +
    weights.sportiness_weight * normalizedSportiness +
    weights.price_weight * normalizedAffordability +
    weights.budget_weight * normalizedBudgetFit +
    weights.fuel_type_weight * normalizedFuelType +
    weights.drive_weight * normalizedDrive +
    weights.transmission_weight * normalizedTransmission +
    weights.mpg_weight * normalizedCombinedMpg +
    weights.emissions_weight * normalizedCo2Gpm
  );
};

export {
  DEFAULT_WEIGHTS,
  computeCompositeScore,
  computeNormalizedScores,
  getNormalizationBounds,
  normalizeRange,
  resolveWeights,
};

const formatFuelEconomy = (row: CarRow) => {
  if (row.city_mpg && row.highway_mpg) {
    return `${row.city_mpg}/${row.highway_mpg} MPG`;
  }
  if (row.combined_mpg) {
    return `${row.combined_mpg} MPG (combined)`;
  }
  return "Fuel economy unavailable";
};

const deriveTags = (row: CarRow) => {
  const tags: string[] = [];
  const fuelType = row.fuel_type?.toLowerCase() ?? "";
  const vehicleClass = row.vehicle_class?.toLowerCase() ?? "";
  const drive = row.drive?.toLowerCase() ?? "";

  if (row.combined_mpg && row.combined_mpg >= 35) {
    tags.push("fuel-economy");
  }
  if (fuelType.includes("electricity") || fuelType.includes("electric")) {
    tags.push("ev");
  }
  if (fuelType.includes("hybrid")) {
    tags.push("hybrid");
  }
  if (vehicleClass.includes("suv") || vehicleClass.includes("van") || vehicleClass.includes("wagon")) {
    tags.push("spacious");
  }
  if (drive.includes("awd") || drive.includes("4wd")) {
    tags.push("all-wheel-drive");
  }

  return tags;
};

const addReason = (reasons: string[], reason: string) => {
  if (!reasons.includes(reason) && reasons.length < 3) {
    reasons.push(reason);
  }
};

const scoreCar = (
  car: CandidateCar,
  prefs: Preferences,
  bounds: NormalizationBounds,
  weights: ScoreWeights,
  derivedPreferences: DerivedPreferences,
): ScoredCar => {
  const compositeScore = computeCompositeScore(
    car,
    bounds,
    weights,
    prefs,
    derivedPreferences,
  );
  const score = Math.round(compositeScore * 100);
  const reasons: string[] = [];

  let bodyStyleMatches = false;
  if (prefs.bodyStyle && car.type !== "Unknown") {
    const normalizedCarType = normalizeValue(car.type);
    const normalizedPrefType = normalizeValue(prefs.bodyStyle);
    if (
      normalizedCarType.includes(normalizedPrefType) ||
      normalizedPrefType.includes(normalizedCarType)
    ) {
      bodyStyleMatches = true;
      addReason(reasons, `${car.type} body style matches your preference`);
    }
  }

  const matchedPriorities = prefs.priorities.filter((priority) =>
    car.tags.includes(priority)
  );
  if (matchedPriorities.length > 0) {
    addReason(reasons, `Strong in: ${matchedPriorities.join(", ")}`);
  }

  if (car.tags.includes("fuel-economy")) {
    addReason(reasons, "Strong fuel economy for its class");
  }
  if (car.tags.includes("ev")) {
    addReason(reasons, "All-electric powertrain with lower running costs");
  }
  if (car.tags.includes("hybrid")) {
    addReason(reasons, "Hybrid powertrain for improved efficiency");
  }
  if (car.tags.includes("spacious")) {
    addReason(reasons, "Spacious layout suitable for passengers and cargo");
  }
  if (car.tags.includes("all-wheel-drive")) {
    addReason(reasons, "All-wheel drive available for added traction");
  }

  if (prefs.budgetLow || prefs.budgetHigh) {
    addReason(
      reasons,
      "Price varies by trim/region — check local pricing for your budget.",
    );
  }

  if (reasons.length < 2) {
    if (car.fuelEconomy !== "Fuel economy unavailable") {
      addReason(reasons, `Fuel economy: ${car.fuelEconomy}`);
    }
  }

  if (reasons.length < 2 && car.drive) {
    addReason(reasons, `Drivetrain: ${car.drive}`);
  }

  if (reasons.length < 2 && !bodyStyleMatches) {
    addReason(reasons, `${car.year} model with modern features`);
  }

  if (reasons.length < 2) {
    if (car.type !== "Unknown") {
      addReason(reasons, `Listed as a ${car.type} in EPA data`);
    } else {
      addReason(reasons, "EPA data available for this model year");
    }
  }

  return {
    make: car.make,
    model: car.model,
    year: car.year,
    type: car.type,
    priceRange: car.priceRange,
    fuelEconomy: car.fuelEconomy,
    score,
    reasons: reasons.slice(0, 3),
    safetyRating: null,
    msrp: car.msrp,
    comfortScore: car.comfortScore,
    sportinessScore: car.sportinessScore,
    transmission: car.transmission,
    cityMpg: car.cityMpg,
    highwayMpg: car.highwayMpg,
    combinedMpg: car.combinedMpg,
    co2Gpm: car.co2Gpm,
  };
};

// 🔹 Call OpenAI to get a short explanation
async function getExplanation(
  userInput: string,
  car: ScoredCar & {
    drive?: string | null;
    fuelType?: string | null;
    vehicleClass?: string | null;
  },
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set");
    return `The ${car.year} ${car.make} ${car.model} matches your needs. ${car.reasons.join(
      " ",
    )}.`;
  }

  const prompt = `
User's description:
"""${userInput}"""

Recommended car:
- ${car.year} ${car.make} ${car.model}
- Vehicle class: ${car.vehicleClass ?? "Unknown"}
- MSRP: ${typeof car.msrp === "number" ? `$${car.msrp.toLocaleString()}` : "Unknown"}
- Comfort score: ${car.comfortScore ?? "Unknown"}
- Sportiness score: ${car.sportinessScore ?? "Unknown"}
- Transmission: ${car.transmission ?? "Unknown"}
- City MPG: ${car.cityMpg ?? "Unknown"}
- Highway MPG: ${car.highwayMpg ?? "Unknown"}
- Combined MPG: ${car.combinedMpg ?? "Unknown"}
- CO2 g/mi: ${car.co2Gpm ?? "Unknown"}
- Fuel economy summary: ${car.fuelEconomy}
- Drive: ${car.drive ?? "Unknown"}
- Fuel type: ${car.fuelType ?? "Unknown"}
- Match reasons: ${car.reasons.join("; ")}

In 2–3 short sentences, explain in friendly, plain English why this car is a good fit based on what the user described.
Start with a high-level summary in the first sentence, then mention 1–2 specific strengths that relate to their needs.
Only mention tradeoffs if they are important.
`;

  console.log("OpenAI explanation: calling model…");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a concise, friendly car-buying assistant.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 220,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI explanation: error", text);
    return `The ${car.year} ${car.make} ${car.model} is a strong match for your needs: ${car.reasons.join(
      " ",
    )}.`;
  }

  const data = await response.json();
  const content =
    data.choices?.[0]?.message?.content?.trim() ??
    `The ${car.year} ${car.make} ${car.model} is a strong match for your needs: ${car.reasons.join(
      " ",
    )}.`;

  console.log("OpenAI explanation: success");
  return content;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences, userInput } = await req.json();
    const prefs: Preferences = {
      budgetLow: preferences?.budgetLow ?? 0,
      budgetHigh: preferences?.budgetHigh ?? 0,
      bodyStyle: preferences?.bodyStyle ?? null,
      priorities: Array.isArray(preferences?.priorities)
        ? preferences.priorities
        : [],
      comfort_weight: preferences?.comfort_weight ?? DEFAULT_WEIGHTS.comfort_weight,
      sportiness_weight: preferences?.sportiness_weight ?? DEFAULT_WEIGHTS.sportiness_weight,
      price_weight: preferences?.price_weight ?? DEFAULT_WEIGHTS.price_weight,
      budget_weight: preferences?.budget_weight ?? DEFAULT_WEIGHTS.budget_weight,
      fuel_type_weight: preferences?.fuel_type_weight ?? DEFAULT_WEIGHTS.fuel_type_weight,
      drive_weight: preferences?.drive_weight ?? DEFAULT_WEIGHTS.drive_weight,
      transmission_weight:
        preferences?.transmission_weight ?? DEFAULT_WEIGHTS.transmission_weight,
      mpg_weight: preferences?.mpg_weight ?? DEFAULT_WEIGHTS.mpg_weight,
      emissions_weight: preferences?.emissions_weight ?? DEFAULT_WEIGHTS.emissions_weight,
    };

    console.log("Finding recommendations for preferences:", prefs);
    console.log("User input for explanations:", userInput);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from("cars")
      .select(
        "id, year, make, model, vehicle_class, fuel_type, drive, transmission, city_mpg, highway_mpg, combined_mpg, co2_gpm, msrp, comfortScore, sportinessScore",
      )
      .eq("year", 2025)
      .limit(2000);

    if (prefs.bodyStyle) {
      query = query.ilike("vehicle_class", `%${prefs.bodyStyle}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const candidates: CandidateCar[] = (data ?? []).map((row) => {
      const fuelEconomy = formatFuelEconomy(row);
      const tags = deriveTags(row);
      const priceRange = typeof row.msrp === "number"
        ? `$${row.msrp.toLocaleString()} MSRP`
        : "Check local pricing";

      return {
        make: row.make,
        model: row.model,
        year: row.year,
        type: row.vehicle_class ?? "Unknown",
        priceRange,
        fuelEconomy,
        score: 0,
        reasons: [],
        tags,
        drive: row.drive,
        fuelType: row.fuel_type,
        msrp: row.msrp,
        comfortScore: row.comfortScore,
        sportinessScore: row.sportinessScore,
        transmission: row.transmission,
        cityMpg: row.city_mpg,
        highwayMpg: row.highway_mpg,
        combinedMpg: row.combined_mpg,
        co2Gpm: row.co2_gpm,
        vehicleClass: row.vehicle_class,
      };
    });

    const bounds = getNormalizationBounds(candidates);
    const weights = resolveWeights(prefs);
    const derivedPreferences = deriveUserPreferences(prefs);

    const scoredCars = candidates.map((car) => ({
      candidate: car,
      scored: scoreCar(car, prefs, bounds, weights, derivedPreferences),
    }));

    const topRecommendationsWithDetails: (ScoredCar & {
      drive?: string | null;
      fuelType?: string | null;
      vehicleClass?: string | null;
    })[] = scoredCars
      .sort((a, b) => b.scored.score - a.scored.score)
      .slice(0, 3)
      .map(({ candidate, scored }) => ({
        ...scored,
        drive: candidate.drive,
        fuelType: candidate.fuelType,
        vehicleClass: candidate.vehicleClass ?? candidate.type,
      }));

    const inputText = typeof userInput === "string" ? userInput : "";
    for (let i = 0; i < topRecommendationsWithDetails.length; i++) {
      try {
        topRecommendationsWithDetails[i].aiExplanation = await getExplanation(
          inputText,
          topRecommendationsWithDetails[i],
        );
      } catch (e) {
        console.error("Error generating explanation for car:", e);
        topRecommendationsWithDetails[i].aiExplanation = undefined;
      }
    }

    const topRecommendations = topRecommendationsWithDetails.map(
      ({ drive, fuelType, vehicleClass, ...rest }) => rest,
    );

    console.log("Top recommendations:", topRecommendations);
    console.log("DEBUG_ACTIVE_RECOMMEND_FN_VERSION", "v3-lovable");

    return new Response(
      JSON.stringify({
        recommendations: topRecommendations,
        _debugVersion: "recommend-v3-lovable",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in recommend:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
