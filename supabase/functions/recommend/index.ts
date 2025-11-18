import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample car database (in a real app, this would be loaded from a database or JSON file)
const carsDatabase = [
  {
    make: "Honda",
    model: "Civic",
    year: 2024,
    type: "Sedan",
    priceRange: "$24,000 - $28,000",
    price: 26000,
    fuelEconomy: "33/42 MPG",
    mpgCity: 33,
    mpgHighway: 42,
    safetyRating: 5,
    tags: ["fuel-economy", "reliable", "compact", "safe"]
  },
  {
    make: "Toyota",
    model: "Corolla",
    year: 2024,
    type: "Sedan",
    priceRange: "$22,000 - $26,000",
    price: 24000,
    fuelEconomy: "32/41 MPG",
    mpgCity: 32,
    mpgHighway: 41,
    safetyRating: 5,
    tags: ["fuel-economy", "reliable", "compact", "affordable"]
  },
  {
    make: "Mazda",
    model: "CX-5",
    year: 2024,
    type: "Compact SUV",
    priceRange: "$28,000 - $38,000",
    price: 33000,
    fuelEconomy: "25/31 MPG",
    mpgCity: 25,
    mpgHighway: 31,
    safetyRating: 5,
    tags: ["safe", "spacious", "premium", "all-wheel-drive"]
  },
  {
    make: "Hyundai",
    model: "Elantra",
    year: 2024,
    type: "Sedan",
    priceRange: "$21,000 - $25,000",
    price: 23000,
    fuelEconomy: "33/43 MPG",
    mpgCity: 33,
    mpgHighway: 43,
    safetyRating: 5,
    tags: ["fuel-economy", "affordable", "compact", "warranty"]
  },
  {
    make: "Subaru",
    model: "Impreza",
    year: 2024,
    type: "Hatchback",
    priceRange: "$23,000 - $27,000",
    price: 25000,
    fuelEconomy: "28/36 MPG",
    mpgCity: 28,
    mpgHighway: 36,
    safetyRating: 5,
    tags: ["all-wheel-drive", "safe", "reliable", "compact"]
  },
  {
    make: "Honda",
    model: "CR-V",
    year: 2024,
    type: "Compact SUV",
    priceRange: "$30,000 - $38,000",
    price: 34000,
    fuelEconomy: "28/34 MPG",
    mpgCity: 28,
    mpgHighway: 34,
    safetyRating: 5,
    tags: ["spacious", "reliable", "safe", "family"]
  },
  {
    make: "Mazda",
    model: "3",
    year: 2024,
    type: "Hatchback",
    priceRange: "$23,000 - $30,000",
    price: 26500,
    fuelEconomy: "28/36 MPG",
    mpgCity: 28,
    mpgHighway: 36,
    safetyRating: 5,
    tags: ["fun-to-drive", "premium", "compact", "fuel-economy"]
  },
  {
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    type: "Compact SUV",
    priceRange: "$29,000 - $38,000",
    price: 33500,
    fuelEconomy: "27/35 MPG",
    mpgCity: 27,
    mpgHighway: 35,
    safetyRating: 5,
    tags: ["reliable", "spacious", "all-wheel-drive", "family"]
  }
];

interface Preferences {
  usage: string;
  budget: string;
  priorities: string[];
  priceMax: number;
  preferredTypes: string[];
  rawInput: string;
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
}

function scoreCar(car: any, preferences: Preferences): ScoredCar {
  let score = 0;
  const reasons: string[] = [];

  // Price matching (max 30 points)
  if (car.price <= preferences.priceMax) {
    const priceScore = 30 - ((car.price / preferences.priceMax) * 10);
    score += priceScore;
    reasons.push(`Fits within your ${preferences.priceMax.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} budget`);
  } else {
    score -= 20; // Penalty for over budget
  }

  // Type matching (max 20 points)
  const normalizedType = car.type.toLowerCase().replace(/\s+/g, '-');
  if (preferences.preferredTypes.some(t => normalizedType.includes(t) || t.includes(normalizedType))) {
    score += 20;
    reasons.push(`${car.type} body style matches your preferences`);
  }

  // Priority matching (max 30 points)
  let priorityMatches = 0;
  preferences.priorities.forEach(priority => {
    if (car.tags.includes(priority)) {
      priorityMatches++;
      score += 10;
    }
  });

  if (priorityMatches > 0) {
    const matchedPriorities = preferences.priorities.filter(p => car.tags.includes(p));
    reasons.push(`Excellent ${matchedPriorities.join(', ')} ratings`);
  }

  // Usage-based scoring (max 20 points)
  if (preferences.usage === "city") {
    if (car.mpgCity >= 30) {
      score += 20;
      reasons.push('Outstanding city fuel economy for daily commuting');
    } else if (car.mpgCity >= 25) {
      score += 10;
      reasons.push('Good fuel economy for city driving');
    }
  } else if (preferences.usage === "highway") {
    if (car.mpgHighway >= 35) {
      score += 20;
      reasons.push('Excellent highway fuel efficiency');
    }
  }

  // Safety bonus
  if (car.safetyRating === 5) {
    score += 10;
    reasons.push('Top 5-star safety rating for peace of mind');
  }

  // Ensure we have at least 3 reasons
  if (reasons.length < 3) {
    if (car.tags.includes('reliable')) {
      reasons.push('Proven reliability and low maintenance costs');
    }
    if (reasons.length < 3) {
      reasons.push(`Modern ${car.year} model with latest features`);
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
    score: Math.min(100, Math.max(0, Math.round(score))),
    reasons: reasons.slice(0, 4)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    
    console.log('Finding recommendations for preferences:', preferences);

    // Score all cars
    const scoredCars = carsDatabase.map(car => scoreCar(car, preferences));

    // Sort by score and get top 3
    const topRecommendations = scoredCars
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log('Top recommendations:', topRecommendations);

    return new Response(
      JSON.stringify(topRecommendations),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in recommend:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
