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

const allowedBodyStyles = new Set(["compact suv", "hatchback", "sedan"]);
const allowedPriorities = new Set([
  "fuel-economy",
  "safe",
  "spacious",
  "reliable",
]);

function parseWithHeuristics(userInput: string): Preferences {
  const text = (userInput || "").toLowerCase();
  console.log("parse-preferences received (heuristics):", text);

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

  return {
    budgetLow,
    budgetHigh,
    bodyStyle,
    priorities,
  };
}

function sanitizePreferences(input: Partial<Preferences>): Preferences {
  const budgetLow = Number.isFinite(input.budgetLow) ? Number(input.budgetLow) : 20000;
  const budgetHigh = Number.isFinite(input.budgetHigh) ? Number(input.budgetHigh) : 30000;
  const normalizedBodyStyle =
    typeof input.bodyStyle === "string" ? input.bodyStyle.toLowerCase() : null;
  const bodyStyle = allowedBodyStyles.has(normalizedBodyStyle || "")
    ? normalizedBodyStyle
    : null;
  const priorities = Array.isArray(input.priorities)
    ? input.priorities
        .map((priority) => String(priority).toLowerCase())
        .filter((priority) => allowedPriorities.has(priority))
    : [];

  if (budgetHigh < budgetLow) {
    return {
      budgetLow: budgetHigh,
      budgetHigh: budgetLow,
      bodyStyle,
      priorities,
    };
  }

  return {
    budgetLow,
    budgetHigh,
    bodyStyle,
    priorities,
  };
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();
    const inputText = typeof userInput === "string" ? userInput : "";
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    let preferences: Preferences;
    let parseSource: "openai" | "heuristics";

    if (!apiKey) {
      console.warn("OPENAI_API_KEY is not set; using heuristic parser.");
      preferences = parseWithHeuristics(inputText);
      parseSource = "heuristics";
    } else {
      const prompt = `
Extract user preferences from the following car-buying request and return JSON only.
User request:
"""${inputText}"""

Return strict JSON with this shape:
{
  "budgetLow": number,
  "budgetHigh": number,
  "bodyStyle": "compact suv" | "hatchback" | "sedan" | null,
  "priorities": ["fuel-economy" | "safe" | "spacious" | "reliable"]
}

Rules:
- If budget is a single number, set a reasonable range around it (±$3k–$5k).
- If budget is unknown, use 20000–30000.
- Only use the allowed bodyStyle and priorities values.
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
              content:
                "You extract structured car-buying preferences. Return valid JSON only.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("OpenAI API error:", text);
        preferences = parseWithHeuristics(inputText);
        parseSource = "heuristics";
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || "";
        try {
          const parsed = JSON.parse(content);
          preferences = sanitizePreferences(parsed);
          parseSource = "openai";
        } catch (error) {
          console.error("Failed to parse OpenAI response:", error);
          preferences = parseWithHeuristics(inputText);
          parseSource = "heuristics";
        }
      }
    }

    console.log("Parsed preferences:", preferences, "source:", parseSource);

    return new Response(
      JSON.stringify({
        ...preferences,
        _debugParseSource: parseSource,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
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
