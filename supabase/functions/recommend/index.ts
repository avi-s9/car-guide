import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cars } from "./cars.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const scoredCars = cars.map(car => scoreCar(car, preferences));

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
