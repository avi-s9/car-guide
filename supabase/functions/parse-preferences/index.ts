import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();
    
    console.log('Parsing user preferences:', userInput);

    // For v1, return hardcoded structured preferences
    // In future versions, this could use AI to parse natural language
    const preferences = {
      budgetLow: 20000,
      budgetHigh: 30000,
      bodyStyle: "sedan",
      priorities: ["fuel-economy", "reliable", "safe"]
    };

    console.log('Parsed preferences:', preferences);

    return new Response(
      JSON.stringify(preferences),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in parse-preferences:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
