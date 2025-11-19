import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getExplanation(userInput: string, car: any): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set");
    return "AI explanation unavailable (missing API key).";
  }

  const prompt = `
You are a helpful car buying assistant.

User's description of their situation:
"""${userInput}"""

Recommended car:
- Make: ${car.make}
- Model: ${car.model}
- Year: ${car.year}
- Type: ${car.type}
- Price range: ${car.priceRange}
- Fuel economy: ${car.fuelEconomy}
- Safety rating: ${car.safetyRating} stars
- Tags: ${Array.isArray(car.tags) ? car.tags.join(", ") : ""}

Write 2–3 sentences explaining why this car is a good fit for the user based on their description. 
Be honest about tradeoffs if relevant (e.g. price vs fuel economy). 
Speak in friendly, plain English.
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini", // or another GPT-4/4.1 style model
      messages: [
        { role: "system", content: "You are a concise, friendly car buying assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI API error:", text);
    return "AI explanation unavailable (error from AI service).";
  }

  const data = await response.json();
  const content =
    data.choices?.[0]?.message?.content?.trim() ??
    "AI explanation unavailable.";

  return content;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput, recommendations } = await req.json();
    console.log("explain received:", { userInput, recommendations });

    if (!Array.isArray(recommendations)) {
      return new Response(
        JSON.stringify({ error: "recommendations must be an array" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const enhanced = [];

    for (const car of recommendations) {
      const aiExplanation = await getExplanation(userInput, car);
      enhanced.push({ ...car, aiExplanation });
    }

    return new Response(
      JSON.stringify({ recommendations: enhanced }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in explain:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate explanations" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
