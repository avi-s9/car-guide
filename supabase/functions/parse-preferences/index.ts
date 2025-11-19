import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();
    const text = (userInput || "").toLowerCase();
    console.log("parse-preferences received:", text);

    // --- default values ---
    let budgetLow = 20000;
    let budgetHigh = 30000;
    let bodyStyle: string | null = null;
    const priorities: string[] = [];

    // crude budget parsing: "$25k", "25k", "$25000"
    const dollarMatch = text.match(/\$?\s*(\d{2,3})\s*k\b/);
    const fullNumMatch = text.match(/\$?\s*(\d{5})\b/);

    if (dollarMatch) {
      const mid = parseInt(dollarMatch[1], 10) * 1000;
      budgetLow = mid - 5000;
      budgetHigh = mid + 5000;
    } else if (fullNumMatch) {
      const mid = parseInt(fullNumMatch[1], 10);
      budgetLow = mid - 3000;
      budgetHigh = mid + 3000;
    }

    // body style from keywords
    if (text.includes("suv") || text.includes("crossover")) {
      bodyStyle = "compact suv";
    } else if (text.includes("hatchback")) {
      bodyStyle = "hatchback";
    } else if (text.includes("sedan")) {
      bodyStyle = "sedan";
    }

    // priorities from keywords mapped to your car.tags
    if (text.includes("fuel") || text.includes("mpg") || text.includes("gas")) {
      priorities.push("fuel-economy");
    }
    if (text.includes("safe") || text.includes("safety")) {
      priorities.push("safe");
    }
    if (text.includes("family") || text.includes("kids") || text.includes("space")) {
      priorities.push("spacious");
    }
    if (text.includes("reliable") || text.includes("reliability")) {
      priorities.push("reliable");
    }

    const preferences: Preferences = {
      budgetLow,
      budgetHigh,
      bodyStyle,
      priorities,
    };

    console.log("Parsed preferences:", preferences);

    return new Response(JSON.stringify(preferences), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error in parse-preferences:", error);
    return new Response(
      JSON.stringify({ error: "Failed to parse preferences" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      },
    );
  }
});
