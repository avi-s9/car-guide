import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cars } from "./cars.ts";

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

interface ScoredCar {
  make: string;
  model: string;
  year: number;
  type: string;
  priceRange: string;
  fuelEconomy: string;
  safetyRating: number;
  score: number;
  reasons: string[];
  aiExplanation?: string; // 👈 new
}

// Same scoring logic as before
function scoreCar(car: any, prefs: Preferences): ScoredCar {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Budget matching - penalize if out of range
  if (car.price < prefs.budgetLow || car.price > prefs.budgetHigh) {
    score -= 100; // Heavy penalty for out of budget
  } else {
    score += 30;
    reasons.push(
      `Fits within your $${prefs.budgetLow.toLocaleString()} - $${prefs.budgetHigh.toLocaleString()} budget`,
    );
  }

  // Body style matching
  if (prefs.bodyStyle) {
    const normalizedCarType = car.type.toLowerCase().replace(/\s+/g, "-");
    const normalizedPrefType = prefs.bodyStyle.toLowerCase().replace(/\s+/g, "-");
    if (
      normalizedCarType.includes(normalizedPrefType) ||
      normalizedPrefType.includes(normalizedCarType)
    ) {
      score += 25;
      reasons.push(`${car.type} body style matches your preference`);
    }
  }

  // Priorities matching - check overlap with car tags
  let priorityMatches = 0;
  prefs.priorities.forEach((priority) => {
    if (car.tags.includes(priority)) {
      priorityMatches++;
      score += 15;
    }
  });

  if (priorityMatches > 0) {
    const matchedPriorities = prefs.priorities.filter((p) =>
      car.tags.includes(p)
    );
    reasons.push(`Strong in: ${matchedPriorities.join(", ")}`);
  }

  // Safety bonus
  if (car.safetyRating === 5) {
    score += 10;
    reasons.push("Top 5-star safety rating");
  }

  // Ensure we have at least 2 reasons
  if (reasons.length < 2) {
    if (car.tags.includes("reliable")) {
      reasons.push("Proven reliability");
    }
    if (reasons.length < 2) {
      reasons.push(`${car.year} model with modern features`);
    }
  }

  return {
    make: car.make,
    model: car.model,
    year: car.year,
    type: car.type,
    priceRange: car.priceRange,
    fuelEconomy: car.fuelEconomy,
    safetyRating: car.safetyRating,
    score: Math.round(score),
    reasons: reasons.slice(0, 3),
  };
}

// 👇 helper to call OpenAI and get a friendly explanation
async function getExplanation(
  userInput: string,
  car: ScoredCar,
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set");
    // fall back to simple explanation using reasons
    return `The ${car.year} ${car.make} ${car.model} matches your needs. ${car.reasons.join(" ")}.`;
  }

  const prompt = `
User's description:
"""${userInput}"""

Recommended car:
- ${car.year} ${car.make} ${car.model} (${car.type})
- Price range: ${car.priceRange}
- Fuel economy: ${car.fuelEconomy}
- Safety rating: ${car.safetyRating} stars
- Match reasons: ${car.reasons.join("; ")}

In 2–3 short sentences, explain in friendly, plain English why this car is a good fit based on what the user described. Mention tradeoffs if relevant.
`;

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
    console.error("OpenAI API error:", text);
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

  return content;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences, userInput } = await req.json();
    console.log("Finding recommendations for preferences:", preferences);
    console.log("User input for explanations:", userInput);

    // Score all cars
    const scoredCars = cars.map((car) => scoreCar(car, preferences));

    // Sort by score and get top 3
    const topRecommendations: ScoredCar[] = scoredCars
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 👇 Add AI explanations for each top car
    const inputText = typeof userInput === "string" ? userInput : "";
    for (let i = 0; i < topRecommendations.length; i++) {
      try {
        topRecommendations[i].aiExplanation = await getExplanation(
          inputText,
          topRecommendations[i],
        );
      } catch (e) {
        console.error("Error generating explanation for car:", e);
        topRecommendations[i].aiExplanation = undefined; // fallback
      }
    }

    console.log("Top recommendations:", topRecommendations);

    return new Response(
      JSON.stringify({ recommendations: topRecommendations }),
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
