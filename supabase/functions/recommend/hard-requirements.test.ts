import {
  deriveHardRequirements,
  filterCarsByHardRequirements,
} from "./index.ts";
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const basePrefs = {
  budgetLow: 0,
  budgetHigh: 0,
  bodyStyle: null,
  priorities: [] as string[],
  comfort_weight: 0,
  sportiness_weight: 0,
  price_weight: 0,
  fuelTypeHint: null,
  drivetrainHint: null,
  transmissionHint: null,
  efficiencyHint: null as "high" | null,
};

Deno.test("deriveHardRequirements sets AWD and electric as required with strong intent", () => {
  const hardRequirements = deriveHardRequirements(
    {
      ...basePrefs,
      drivetrainHint: "AWD/4WD",
      fuelTypeHint: "Electric",
    },
    "It must be AWD and must be electric.",
  );

  assertEquals(hardRequirements, {
    requireFuelTypeHint: "Electric",
    requireDrivetrainHint: "AWD/4WD",
  });
});

Deno.test("deriveHardRequirements ignores generic strong words not tied to AWD/electric hint", () => {
  const hardRequirements = deriveHardRequirements(
    {
      ...basePrefs,
      drivetrainHint: "AWD/4WD",
      fuelTypeHint: "Electric",
    },
    "I need a car for commuting in the city with good range.",
  );

  assertEquals(hardRequirements, {
    requireFuelTypeHint: null,
    requireDrivetrainHint: null,
  });
});


Deno.test("deriveHardRequirements does not enforce drivetrain for negated need", () => {
  const hardRequirements = deriveHardRequirements(
    {
      ...basePrefs,
      drivetrainHint: "AWD/4WD",
    },
    "I don't need AWD for where I drive.",
  );

  assertEquals(hardRequirements, {
    requireFuelTypeHint: null,
    requireDrivetrainHint: null,
  });
});

Deno.test("deriveHardRequirements does not enforce fuel hint for negated requirement", () => {
  const hardRequirements = deriveHardRequirements(
    {
      ...basePrefs,
      fuelTypeHint: "Electric",
    },
    "Electric is not required for me.",
  );

  assertEquals(hardRequirements, {
    requireFuelTypeHint: null,
    requireDrivetrainHint: null,
  });
});

Deno.test("filterCarsByHardRequirements removes cars that fail required hints", () => {
  const cars = [
    {
      id: "ev-awd",
      make: "A",
      model: "One",
      year: 2025,
      type: "SUV",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: null,
      sportinessScore: null,
      msrp: 50000,
      drive: "AWD",
      fuelType: "Electricity",
      vehicleClass: null,
    },
    {
      id: "gas-awd",
      make: "B",
      model: "Two",
      year: 2025,
      type: "SUV",
      priceRange: "",
      fuelEconomy: "",
      score: 0,
      reasons: [],
      tags: [],
      comfortScore: null,
      sportinessScore: null,
      msrp: 45000,
      drive: "AWD",
      fuelType: "Gasoline",
      vehicleClass: null,
    },
  ];

  const filtered = filterCarsByHardRequirements(cars, {
    requireFuelTypeHint: "Electric",
    requireDrivetrainHint: "AWD/4WD",
  });

  assertEquals(filtered.map((car) => car.id), ["ev-awd"]);
});
