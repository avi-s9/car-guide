export type VehicleType = "Sedan" | "SUV" | "Hatchback" | "Coupe" | "Truck" | "Other";
export type DrivingMix = "Mostly city" | "Mostly highway" | "Mix";
export type Priority =
  | "Balanced"
  | "Lowest price"
  | "Best fuel economy"
  | "Most comfortable"
  | "Sportiest";

export interface CarRow {
  year: number;
  make: string;
  model: string;
  vehicleClass: string;
  fuelType: string;
  drive: string;
  transmission: string;
  cityMpg: number;
  highwayMpg: number;
  combinedMpg: number;
  co2: number;
  msrp: number;
  comfortScore: number;
  sportinessScore: number;
  vehicleTypeBucket: VehicleType;
}

export interface RankedCar extends CarRow {
  finalScore: number;
  priceScore: number;
  mpgScore: number;
  comfort: number;
  sporty: number;
}

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

const normalizeString = (value: string) => value.trim().toLowerCase();

export const bucketVehicleClass = (vehicleClass: string): VehicleType => {
  const value = normalizeString(vehicleClass);

  if (value.includes("suv")) return "SUV";
  if (value.includes("hatchback")) return "Hatchback";
  if (value.includes("coupe") || value.includes("two seater") || value.includes("two-seater")) return "Coupe";
  if (value.includes("truck") || value.includes("pick-up") || value.includes("pickup")) return "Truck";
  if (
    value.includes("sedan") ||
    value.includes("cars") ||
    value.includes("wagon") ||
    value.includes("compact") ||
    value.includes("midsize") ||
    value.includes("subcompact")
  ) {
    return "Sedan";
  }

  return "Other";
};

const parseCsv = (csvText: string): ParsedCsv => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      row.push(value);
      value = "";
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell.trim().length > 0)) {
      rows.push(row);
    }
  }

  const headers = rows.shift() ?? [];
  return { headers, rows };
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseCarsCsv = (csvText: string): CarRow[] => {
  const { headers, rows } = parseCsv(csvText);
  const indexByHeader = new Map(headers.map((header, index) => [header, index]));

  return rows
    .map((values) => {
      const get = (header: string) => values[indexByHeader.get(header) ?? -1] ?? "";
      const vehicleClass = get("vehicleClass");

      return {
        year: toNumber(get("year")),
        make: get("make").trim(),
        model: get("model").trim(),
        vehicleClass,
        fuelType: get("fuelType").trim(),
        drive: get("drive").trim(),
        transmission: get("transmission").trim(),
        cityMpg: toNumber(get("cityMpg")),
        highwayMpg: toNumber(get("highwayMpg")),
        combinedMpg: toNumber(get("combinedMpg")),
        co2: toNumber(get("co2")),
        msrp: toNumber(get("msrp")),
        comfortScore: toNumber(get("comfortScore")),
        sportinessScore: toNumber(get("sportinessScore")),
        vehicleTypeBucket: bucketVehicleClass(vehicleClass),
      };
    })
    .filter((car) => car.make && car.model && car.year > 0 && car.msrp > 0);
};

export const getBudgetDefaults = (cars: CarRow[]) => {
  const sorted = cars.map((car) => car.msrp).sort((a, b) => a - b);
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;

  const quantile = (q: number) => {
    if (!sorted.length) return 0;
    const index = Math.round((sorted.length - 1) * q);
    return sorted[index];
  };

  const defaultMin = Math.max(min, quantile(0.25));
  const defaultMax = Math.min(max, quantile(0.75));

  return {
    min,
    max,
    defaultMin,
    defaultMax: defaultMax > defaultMin ? defaultMax : max,
  };
};

export const getAvailableVehicleTypes = (cars: CarRow[]): VehicleType[] => {
  const ordered: VehicleType[] = ["Sedan", "SUV", "Hatchback", "Coupe", "Truck"];
  const available = new Set(cars.map((car) => car.vehicleTypeBucket));
  return ordered.filter((type) => available.has(type));
};

export const getAvailableFuelTypes = (cars: CarRow[]): string[] => {
  const map = new Map<string, string>();

  for (const car of cars) {
    const key = normalizeString(car.fuelType);
    if (!key || map.has(key)) continue;
    map.set(key, car.fuelType.trim());
  }

  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
};

const fieldValueByMix = (car: CarRow, drivingMix: DrivingMix) => {
  if (drivingMix === "Mostly city") return car.cityMpg;
  if (drivingMix === "Mostly highway") return car.highwayMpg;
  return car.combinedMpg;
};

export const filterCars = (
  cars: CarRow[],
  budgetMin: number,
  budgetMax: number,
  selectedVehicleTypes: VehicleType[],
  selectedFuelTypes: string[],
) => {
  const normalizedFuelSet = new Set(selectedFuelTypes.map(normalizeString));
  const vehicleTypeSet = new Set(selectedVehicleTypes);

  return cars.filter((car) => {
    if (car.msrp < budgetMin || car.msrp > budgetMax) return false;

    if (vehicleTypeSet.size > 0 && !vehicleTypeSet.has(car.vehicleTypeBucket)) {
      return false;
    }

    if (normalizedFuelSet.size > 0 && !normalizedFuelSet.has(normalizeString(car.fuelType))) {
      return false;
    }

    if (vehicleTypeSet.size === 0 && car.vehicleTypeBucket === "Other") {
      return false;
    }

    return true;
  });
};

const priorityWeights: Record<Priority, { price: number; mpg: number; comfort: number; sporty: number }> = {
  Balanced: { price: 0.3, mpg: 0.25, comfort: 0.25, sporty: 0.2 },
  "Lowest price": { price: 0.6, mpg: 0.15, comfort: 0.15, sporty: 0.1 },
  "Best fuel economy": { price: 0.15, mpg: 0.6, comfort: 0.15, sporty: 0.1 },
  "Most comfortable": { price: 0.15, mpg: 0.15, comfort: 0.6, sporty: 0.1 },
  Sportiest: { price: 0.15, mpg: 0.15, comfort: 0.1, sporty: 0.6 },
};

const normalizeMinMax = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return 0.5;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return 0.5;
  return (value - min) / (max - min);
};

export const rankCars = (cars: CarRow[], drivingMix: DrivingMix, priority: Priority): RankedCar[] => {
  if (!cars.length) return [];

  const msrpValues = cars.map((car) => car.msrp);
  const mpgValues = cars.map((car) => fieldValueByMix(car, drivingMix));
  const comfortValues = cars.map((car) => car.comfortScore);
  const sportyValues = cars.map((car) => car.sportinessScore);

  const msrpMin = Math.min(...msrpValues);
  const msrpMax = Math.max(...msrpValues);
  const mpgMin = Math.min(...mpgValues);
  const mpgMax = Math.max(...mpgValues);
  const comfortMin = Math.min(...comfortValues);
  const comfortMax = Math.max(...comfortValues);
  const sportyMin = Math.min(...sportyValues);
  const sportyMax = Math.max(...sportyValues);

  const weights = priorityWeights[priority];

  return cars
    .map((car) => {
      const priceScore = 1 - normalizeMinMax(car.msrp, msrpMin, msrpMax);
      const mpgScore = normalizeMinMax(fieldValueByMix(car, drivingMix), mpgMin, mpgMax);
      const comfort = normalizeMinMax(car.comfortScore, comfortMin, comfortMax);
      const sporty = normalizeMinMax(car.sportinessScore, sportyMin, sportyMax);
      const finalScore =
        weights.price * priceScore +
        weights.mpg * mpgScore +
        weights.comfort * comfort +
        weights.sporty * sporty;

      return {
        ...car,
        finalScore,
        priceScore,
        mpgScore,
        comfort,
        sporty,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
