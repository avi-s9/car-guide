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
}

type CandidateCar = ScoredCar & {
  drive?: string | null;
  fuelType?: string | null;
  tags: string[];
};

const normalizeValue = (value: string) => value.toLowerCase().replace(/\s+/g, "-");

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

const scoreCar = (car: CandidateCar, prefs: Preferences): ScoredCar => {
  let score = 50;
  const reasons: string[] = [];

  let bodyStyleMatches = false;
  if (prefs.bodyStyle && car.type !== "Unknown") {
    const normalizedCarType = normalizeValue(car.type);
    const normalizedPrefType = normalizeValue(prefs.bodyStyle);
    if (
      normalizedCarType.includes(normalizedPrefType) ||
      normalizedPrefType.includes(normalizedCarType)
    ) {
      score += 20;
      bodyStyleMatches = true;
      addReason(reasons, `${car.type} body style matches your preference`);
    }
  }

  const matchedPriorities = prefs.priorities.filter((priority) =>
    car.tags.includes(priority)
  );
  matchedPriorities.forEach(() => {
    score += 15;
  });
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
    score: Math.round(score),
    reasons: reasons.slice(0, 3),
    safetyRating: null,
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
- Fuel economy: ${car.fuelEconomy}
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
        "id, year, make, model, vehicle_class, fuel_type, drive, transmission, city_mpg, highway_mpg, combined_mpg, co2_gpm",
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

      return {
        make: row.make,
        model: row.model,
        year: row.year,
        type: row.vehicle_class ?? "Unknown",
        priceRange: "Check local pricing",
        fuelEconomy,
        score: 0,
        reasons: [],
        tags,
        drive: row.drive,
        fuelType: row.fuel_type,
      };
    });

    const scoredCars = candidates.map((car) => ({
      candidate: car,
      scored: scoreCar(car, prefs),
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
        vehicleClass: candidate.type,
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
