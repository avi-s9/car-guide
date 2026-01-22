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
  msrp: number | null;
  comfort_score: number | null;
  sportiness_score: number | null;
}

const normalizeIdPart = (value: string) => {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const toNumber = (value: string | undefined): number | null => {
  if (!value || value.trim() === "") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toInt = (value: string | undefined): number | null => {
  if (!value || value.trim() === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildId = (
  year: number,
  make: string,
  model: string,
  transmission: string | null,
  drive: string | null,
) => {
  const parts = [
    String(year),
    make || "unknown",
    model || "unknown",
    transmission || "unknown",
    drive || "unknown",
  ];
  return parts.map(normalizeIdPart).join("-");
};

const parseCsv = (csvText: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\n" || char === "\r") {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((field) => field !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  const records: Record<string, string>[] = [];

  for (const row of rows.slice(1)) {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (row[index] ?? "").trim();
    });
    records.push(record);
  }

  return records;
};

// Helper to get value case-insensitively
const getField = (row: Record<string, string>, ...keys: string[]): string => {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
    // Try lowercase
    const lower = key.toLowerCase();
    if (row[lower] !== undefined) return row[lower];
    // Try exact match with common variations
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === lower) return row[rowKey];
    }
  }
  return "";
};

const transformRows = (rows: Record<string, string>[]): CarRow[] => {
  const cars: CarRow[] = [];

  for (const row of rows) {
    const year = toInt(getField(row, "year")) ?? 2025;
    const make = getField(row, "make").trim();
    const model = getField(row, "model").trim();
    const transmission = getField(row, "transmission").trim() || null;
    const drive = getField(row, "drive").trim() || null;

    if (!make || !model) {
      continue;
    }

    cars.push({
      id: buildId(year, make, model, transmission, drive),
      year,
      make,
      model,
      vehicle_class: getField(row, "vehicleClass", "vehicle_class").trim() || null,
      fuel_type: getField(row, "fuelType", "fuel_type").trim() || null,
      drive,
      transmission,
      city_mpg: toInt(getField(row, "cityMpg", "city_mpg")),
      highway_mpg: toInt(getField(row, "highwayMpg", "highway_mpg")),
      combined_mpg: toInt(getField(row, "combinedMpg", "combined_mpg")),
      co2_gpm: toInt(getField(row, "co2", "co2_gpm")),
      msrp: toInt(getField(row, "msrp")),
      comfort_score: toNumber(getField(row, "comfortScore", "comfort_score")),
      sportiness_score: toNumber(getField(row, "sportinessScore", "sportiness_score")),
    });
  }

  return cars;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    }

    let csvData: string;
    
    // Check if request has body with csvUrl
    const body = await req.json().catch(() => ({}));
    
    if (body.csvUrl) {
      // Fetch CSV from URL
      console.log(`Fetching CSV from: ${body.csvUrl}`);
      const response = await fetch(body.csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }
      csvData = await response.text();
    } else if (body.csvData) {
      csvData = body.csvData;
    } else {
      return new Response(JSON.stringify({ error: "Either csvUrl or csvData is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = parseCsv(csvData);
    console.log(`Parsed ${rows.length} rows from CSV`);

    const cars = transformRows(rows);
    console.log(`Transformed ${cars.length} car records`);

    if (cars.length === 0) {
      return new Response(JSON.stringify({ error: "No valid car records found." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Upsert in batches of 100
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < cars.length; i += BATCH_SIZE) {
      const batch = cars.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("cars").upsert(batch, {
        onConflict: "id",
      });

      if (error) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
        throw error;
      }
      
      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} records`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      inserted,
      message: `Successfully imported ${inserted} car records.`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("import-cars-csv failed:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
