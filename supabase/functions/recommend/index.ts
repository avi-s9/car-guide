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
  fuelTypeHint: string | null;
  drivetrainHint: string | null;
  transmissionHint: string | null;
  efficiencyHint: "high" | null;
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
}

interface NormalizationBounds {
  minComfort: number;
  maxComfort: number;
  minSportiness: number;
  maxSportiness: number;
  minMsrp: number;
  maxMsrp: number;
}

const normalizeValue = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

type ParsedHints = {
  bodyStyle?: string;
  fuelTypeHint?: string;
  drivetrainHint?: string;
  transmissionHint?: string;
  efficiencyHint?: "high";
  priorityTags: string[];
};

// Keyword mappings for lightweight parsing (extend as needed).
const USER_INPUT_HINT_MAPPINGS = {
  bodyStyle: [
    { keywords: ["suv", "sport utility", "crossover"], value: "SUV", tags: ["spacious"] },
    { keywords: ["truck", "pickup"], value: "Truck", tags: [] },
    { keywords: ["minivan", "van"], value: "Van", tags: ["spacious"] },
    { keywords: ["wagon", "estate"], value: "Wagon", tags: ["spacious"] },
    { keywords: ["sedan", "saloon"], value: "Sedan", tags: [] },
    { keywords: ["coupe", "convertible", "roadster"], value: "Coupe", tags: [] },
    { keywords: ["hatchback"], value: "Hatchback", tags: [] },
  ],
  fuelType: [
    { keywords: ["electric", "ev", "battery"], value: "Electric", tags: ["ev"] },
    { keywords: ["hybrid", "plug-in", "phev"], value: "Hybrid", tags: ["hybrid", "fuel-economy"] },
    { keywords: ["diesel"], value: "Diesel", tags: [] },
    { keywords: ["gas", "gasoline", "petrol"], value: "Gasoline", tags: [] },
  ],
  drivetrain: [
    {
      keywords: [
        "awd",
        "all wheel",
        "all-wheel",
        "4wd",
        "4x4",
        "four wheel",
        "snow",
        "ice",
        "icy",
        "blizzard",
        "mountain",
        "mud",
        "off-road",
        "off road",
        "trail",
      ],
      value: "AWD/4WD",
      tags: ["all-wheel-drive"],
    },
    { keywords: ["fwd", "front wheel", "front-wheel"], value: "FWD", tags: [] },
    { keywords: ["rwd", "rear wheel", "rear-wheel"], value: "RWD", tags: [] },
  ],
  transmission: [
    { keywords: ["manual", "stick shift", "stick"], value: "Manual", tags: [] },
    { keywords: ["automatic", "auto"], value: "Automatic", tags: [] },
    { keywords: ["cvt"], value: "CVT", tags: [] },
  ],
  efficiency: [
    {
      keywords: [
        "mpg",
        "fuel efficient",
        "fuel-efficient",
        "economy",
        "efficient",
        "save gas",
        "low emissions",
        "co2",
        "range",
        "charging",
      ],
      value: "high",
      tags: ["fuel-economy"],
    },
  ],
};

const parseUserInputHints = (userInput: string): ParsedHints => {
  const input = userInput.toLowerCase();
  const priorityTags: string[] = [];

  const matchFirst = <T extends { keywords: string[] }>(items: T[]) =>
    items.find((item) => item.keywords.some((keyword) => input.includes(keyword)));

  const bodyStyleMatch = matchFirst(USER_INPUT_HINT_MAPPINGS.bodyStyle);
  if (bodyStyleMatch) {
    priorityTags.push(...bodyStyleMatch.tags);
  }

  const fuelTypeMatch = matchFirst(USER_INPUT_HINT_MAPPINGS.fuelType);
  if (fuelTypeMatch) {
    priorityTags.push(...fuelTypeMatch.tags);
  }

  const drivetrainMatch = matchFirst(USER_INPUT_HINT_MAPPINGS.drivetrain);
  if (drivetrainMatch) {
    priorityTags.push(...drivetrainMatch.tags);
  }

  const transmissionMatch = matchFirst(USER_INPUT_HINT_MAPPINGS.transmission);
  if (transmissionMatch) {
    priorityTags.push(...transmissionMatch.tags);
  }

  const efficiencyMatch = matchFirst(USER_INPUT_HINT_MAPPINGS.efficiency);
  if (efficiencyMatch) {
    priorityTags.push(...efficiencyMatch.tags);
  }

  return {
    bodyStyle: bodyStyleMatch?.value,
    fuelTypeHint: fuelTypeMatch?.value,
    drivetrainHint: drivetrainMatch?.value,
    transmissionHint: transmissionMatch?.value,
    efficiencyHint: efficiencyMatch?.value,
    priorityTags,
  };
};

const DEFAULT_WEIGHTS: ScoreWeights = {
  comfort_weight: 0.33,
  sportiness_weight: 0.33,
  price_weight: 0.34,
};

const resolveWeights = (prefs: Preferences): ScoreWeights => {
  const comfort = prefs.comfort_weight ?? DEFAULT_WEIGHTS.comfort_weight;
  const sportiness = prefs.sportiness_weight ?? DEFAULT_WEIGHTS.sportiness_weight;
  const price = prefs.price_weight ?? DEFAULT_WEIGHTS.price_weight;
  const total = comfort + sportiness + price;

  if (!Number.isFinite(total) || total <= 0) {
    return { ...DEFAULT_WEIGHTS };
  }

  return {
    comfort_weight: comfort / total,
    sportiness_weight: sportiness / total,
    price_weight: price / total,
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

  const minComfort = comfortValues.length ? Math.min(...comfortValues) : 1;
  const maxComfort = comfortValues.length ? Math.max(...comfortValues) : 10;
  const minSportiness = sportinessValues.length ? Math.min(...sportinessValues) : 1;
  const maxSportiness = sportinessValues.length ? Math.max(...sportinessValues) : 10;
  const minMsrp = msrpValues.length ? Math.min(...msrpValues) : 0;
  const maxMsrp = msrpValues.length ? Math.max(...msrpValues) : 0;

  return {
    minComfort,
    maxComfort,
    minSportiness,
    maxSportiness,
    minMsrp,
    maxMsrp,
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

const computeNormalizedScores = (
  car: CandidateCar,
  bounds: NormalizationBounds,
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

  return {
    normalizedComfort,
    normalizedSportiness,
    normalizedAffordability,
  };
};

const computeCompositeScore = (
  car: CandidateCar,
  bounds: NormalizationBounds,
  weights: ScoreWeights,
) => {
  const {
    normalizedComfort,
    normalizedSportiness,
    normalizedAffordability,
  } = computeNormalizedScores(car, bounds);

  return (
    weights.comfort_weight * normalizedComfort +
    weights.sportiness_weight * normalizedSportiness +
    weights.price_weight * normalizedAffordability
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

const PRIORITY_TAG_MAP: Record<string, string[]> = {
  "eco-friendly": ["ev", "hybrid", "low-co2", "high-mpg"],
  "fuel-economy": ["fuel-economy", "high-mpg", "low-co2"],
  efficiency: ["fuel-economy", "high-mpg", "low-co2"],
  electric: ["ev"],
  hybrid: ["hybrid"],
  awd: ["all-wheel-drive"],
  "all-wheel-drive": ["all-wheel-drive"],
  "front-wheel-drive": ["fwd"],
  "rear-wheel-drive": ["rwd"],
  fwd: ["fwd"],
  rwd: ["rwd"],
  manual: ["manual"],
  automatic: ["automatic"],
  cvt: ["cvt"],
};

const resolvePriorityTags = (priority: string) => {
  const normalized = normalizeValue(priority);
  return PRIORITY_TAG_MAP[normalized] ?? [normalized];
};

const deriveTags = (row: CarRow) => {
  const tags: string[] = [];
  const fuelType = row.fuel_type?.toLowerCase() ?? "";
  const vehicleClass = row.vehicle_class?.toLowerCase() ?? "";
  const drive = row.drive?.toLowerCase() ?? "";
  const transmission = row.transmission?.toLowerCase() ?? "";

  if (row.combined_mpg && row.combined_mpg >= 35) {
    tags.push("fuel-economy");
  }
  if (row.combined_mpg && row.combined_mpg >= 40) {
    tags.push("high-mpg");
  }
  if (row.co2_gpm && row.co2_gpm <= 200) {
    tags.push("low-co2");
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
  if (transmission.includes("manual")) {
    tags.push("manual");
  }
  if (transmission.includes("automatic")) {
    tags.push("automatic");
  }
  if (transmission.includes("cvt") || transmission.includes("continuously variable")) {
    tags.push("cvt");
  }
  if (drive.includes("awd") || drive.includes("4wd")) {
    tags.push("all-wheel-drive");
  }
  if (drive.includes("fwd") || drive.includes("front")) {
    tags.push("fwd");
  }
  if (drive.includes("rwd") || drive.includes("rear")) {
    tags.push("rwd");
  }

  return tags;
};

const addReason = (reasons: string[], reason: string) => {
  if (!reasons.includes(reason) && reasons.length < 3) {
    reasons.push(reason);
  }
};

const matchesDrivetrainHint = (hint: string | null, drive: string | null) => {
  if (!hint || !drive) {
    return false;
  }
  const normalizedDrive = drive.toLowerCase();
  const normalizedHint = hint.toLowerCase();
  if (normalizedHint === "awd/4wd") {
    return normalizedDrive.includes("awd") || normalizedDrive.includes("4wd");
  }
  if (normalizedHint === "fwd") {
    return normalizedDrive.includes("fwd") || normalizedDrive.includes("front");
  }
  if (normalizedHint === "rwd") {
    return normalizedDrive.includes("rwd") || normalizedDrive.includes("rear");
  }
  return normalizedDrive.includes(normalizedHint);
};

const matchesFuelTypeHint = (hint: string | null, fuelType: string | null) => {
  if (!hint || !fuelType) {
    return false;
  }
  const normalizedFuel = fuelType.toLowerCase();
  const normalizedHint = hint.toLowerCase();
  if (normalizedHint === "electric") {
    return normalizedFuel.includes("electric");
  }
  if (normalizedHint === "hybrid") {
    return normalizedFuel.includes("hybrid");
  }
  if (normalizedHint === "diesel") {
    return normalizedFuel.includes("diesel");
  }
  if (normalizedHint === "gasoline") {
    return normalizedFuel.includes("gas");
  }
  return normalizedFuel.includes(normalizedHint);
};

const matchesTransmissionHint = (hint: string | null, transmission: string | null) => {
  if (!hint || !transmission) {
    return false;
  }
  const normalizedTransmission = transmission.toLowerCase();
  const normalizedHint = hint.toLowerCase();
  if (normalizedHint === "manual") {
    return normalizedTransmission.includes("manual");
  }
  if (normalizedHint === "automatic") {
    return normalizedTransmission.includes("automatic") ||
      normalizedTransmission.includes("auto");
  }
  if (normalizedHint === "cvt") {
    return normalizedTransmission.includes("cvt");
  }
  return normalizedTransmission.includes(normalizedHint);
};

const scoreCar = (
  car: CandidateCar,
  prefs: Preferences,
  bounds: NormalizationBounds,
  weights: ScoreWeights,
): ScoredCar => {
  const compositeScore = computeCompositeScore(car, bounds, weights);
  const reasons: string[] = [];
  let scoreBonus = 0;

  if (matchesDrivetrainHint(prefs.drivetrainHint, car.drive)) {
    scoreBonus += 5;
    addReason(reasons, "Drivetrain matches your traction needs");
  }

  if (matchesFuelTypeHint(prefs.fuelTypeHint, car.fuelType)) {
    scoreBonus += 4;
    addReason(reasons, "Powertrain aligns with your fuel preference");
  }

  if (matchesTransmissionHint(prefs.transmissionHint, car.transmission)) {
    scoreBonus += 3;
    addReason(reasons, "Transmission matches what you asked for");
  }

  if (prefs.efficiencyHint === "high" && car.tags.includes("fuel-economy")) {
    scoreBonus += 4;
    addReason(reasons, "Efficiency-focused option");
  }

  const score = Math.min(100, Math.round(compositeScore * 100 + scoreBonus));

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

  const priorityMatches = prefs.priorities.map((priority) => {
    const tags = resolvePriorityTags(priority);
    const matchedTags = tags.filter((tag) => car.tags.includes(tag));
    return { priority, tags, matchedTags };
  });
  const matchedPriorityTags = Array.from(
    new Set(priorityMatches.flatMap((match) => match.matchedTags)),
  );
  const matchScore = priorityMatches.reduce((total, match) => {
    if (match.tags.length === 0) {
      return total;
    }
    return total + match.matchedTags.length / match.tags.length;
  }, 0);
  const priorityMatchRatio = priorityMatches.length
    ? matchScore / priorityMatches.length
    : 0;
  const matchBonus = Math.round(priorityMatchRatio * 12);
  const score = Math.min(100, Math.round(compositeScore * 100 + matchBonus));

  if (matchedPriorityTags.length > 0) {
    addReason(reasons, `Matches priorities: ${matchedPriorityTags.join(", ")}`);
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
  if (car.tags.includes("fwd")) {
    addReason(reasons, "Front-wheel drive for efficient packaging and traction");
  }
  if (car.tags.includes("rwd")) {
    addReason(reasons, "Rear-wheel drive for balanced handling feel");
  }
  if (car.tags.includes("manual")) {
    addReason(reasons, "Manual transmission for driver involvement");
  }
  if (car.tags.includes("automatic")) {
    addReason(reasons, "Automatic transmission for easy driving");
  }
  if (car.tags.includes("cvt")) {
    addReason(reasons, "CVT transmission tuned for smooth efficiency");
  }
  if (car.tags.includes("high-mpg")) {
    addReason(reasons, "High MPG rating for fuel savings");
  }
  if (car.tags.includes("low-co2")) {
    addReason(reasons, "Lower CO2 output for reduced emissions");
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
      fuelTypeHint: null,
      drivetrainHint: null,
      transmissionHint: null,
      efficiencyHint: null,
    };

    const inputText = typeof userInput === "string" ? userInput : "";
    const parsedHints = parseUserInputHints(inputText);
    const mergedPriorities = new Set([
      ...prefs.priorities,
      ...parsedHints.priorityTags,
    ]);
    const mergedPrefs: Preferences = {
      ...prefs,
      bodyStyle: prefs.bodyStyle ?? parsedHints.bodyStyle ?? null,
      priorities: Array.from(mergedPriorities),
      fuelTypeHint: parsedHints.fuelTypeHint ?? null,
      drivetrainHint: parsedHints.drivetrainHint ?? null,
      transmissionHint: parsedHints.transmissionHint ?? null,
      efficiencyHint: parsedHints.efficiencyHint ?? null,
    };

    console.log("Finding recommendations for preferences:", mergedPrefs);
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

    if (mergedPrefs.bodyStyle) {
      query = query.ilike("vehicle_class", `%${mergedPrefs.bodyStyle}%`);
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
    const weights = resolveWeights(mergedPrefs);

    const scoredCars = candidates.map((car) => ({
      candidate: car,
      scored: scoreCar(car, mergedPrefs, bounds, weights),
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
