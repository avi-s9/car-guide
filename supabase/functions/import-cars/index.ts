import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

const getAuthToken = (req: Request) => {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  return token || null;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    }

    if (anonKey) {
      const token = getAuthToken(req);
      if (!token || token !== anonKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { cars } = await req.json();
    if (!Array.isArray(cars) || cars.length === 0) {
      return new Response(JSON.stringify({ error: "No cars provided." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from("cars").upsert(cars as CarRow[], {
      onConflict: "id",
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ inserted: cars.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("import-cars failed:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
