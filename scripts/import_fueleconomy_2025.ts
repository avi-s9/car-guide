import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DATA_URLS = [
  "https://www.fueleconomy.gov/feg/epadata/2025.csv",
  "https://www.fueleconomy.gov/feg/epadata/vehicles.csv",
];
const TARGET_YEAR = 2025;
const BATCH_SIZE = 300;

type RawRow = Record<string, string>;

type CarRow = {
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
};

const normalizeIdPart = (value: string) => {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const toNumber = (value: string | undefined) => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getField = (row: RawRow, keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  return undefined;
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

const parseCsv = (csvText: string) => {
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
  const records: RawRow[] = [];

  for (const row of rows.slice(1)) {
    const record: RawRow = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    records.push(record);
  }

  return records;
};

const downloadCsv = async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fueleconomy-"));
  const csvPath = path.join(tempDir, "vehicles.csv");

  for (const url of DATA_URLS) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "car-guide-import/1.0",
      },
    });

    if (!response.ok) {
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(csvPath, buffer);
    console.log("Downloaded...");
    return csvPath;
  }

  throw new Error("Failed to download FuelEconomy.gov datafile.");
};

const transformRows = (rows: RawRow[]) => {
  const cars: CarRow[] = [];

  for (const row of rows) {
    const yearValue = getField(row, ["year", "Year", "YEAR"]);
    const year = yearValue ? Number.parseInt(yearValue, 10) : NaN;
    if (year !== TARGET_YEAR) {
      continue;
    }

    const make = getField(row, ["make", "Make"]) ?? "";
    const model = getField(row, ["model", "Model"]) ?? "";
    const transmission = getField(row, ["trany", "transmission", "Transmission"]) ?? null;
    const drive = getField(row, ["drive", "Drive"]) ?? null;

    const vehicleClass = getField(row, ["VClass", "vehicle_class", "Vehicle Class"]) ?? null;
    const fuelType = getField(row, ["fuelType1", "fuel_type", "Fuel Type"]) ?? null;
    const cityMpg = toNumber(getField(row, ["city08", "city_mpg", "City MPG"]));
    const highwayMpg = toNumber(getField(row, ["highway08", "highway_mpg", "Highway MPG"]));
    const combinedMpg = toNumber(getField(row, ["comb08", "combined_mpg", "Combined MPG"]));
    const co2Gpm = toNumber(getField(row, ["co2TailpipeGpm", "co2_gpm", "CO2 g/mi"]));

    if (!make || !model) {
      continue;
    }

    cars.push({
      id: buildId(year, make, model, transmission, drive),
      year,
      make,
      model,
      vehicle_class: vehicleClass,
      fuel_type: fuelType,
      drive,
      transmission,
      city_mpg: cityMpg,
      highway_mpg: highwayMpg,
      combined_mpg: combinedMpg,
      co2_gpm: co2Gpm,
    });
  }

  return cars;
};

const upsertCars = async (cars: CarRow[]) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const totalBatches = Math.ceil(cars.length / BATCH_SIZE);

  for (let i = 0; i < cars.length; i += BATCH_SIZE) {
    const batch = cars.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`Upserting batch ${batchNumber} of ${totalBatches}...`);
    const { error } = await supabase.from("cars").upsert(batch, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }
};

const run = async () => {
  const csvPath = await downloadCsv();
  const csvText = await fs.readFile(csvPath, "utf-8");
  const rows = parseCsv(csvText);
  console.log(`Parsed ${rows.length} rows`);
  const cars = transformRows(rows);

  await upsertCars(cars);

  console.log(`Done. Upserted/processed ${cars.length} vehicles.`);
};

run().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
