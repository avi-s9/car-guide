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
    const { make, model, year } = await req.json();
    
    if (!make || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: make and model' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching image for ${year} ${make} ${model}`);

    // Build search query
    const searchQuery = `${year} ${make} ${model} car`;
    const encodedQuery = encodeURIComponent(searchQuery);

    // Step 1: Get vqd token from DuckDuckGo
    const vqdResponse = await fetch(`https://duckduckgo.com/?q=${encodedQuery}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const vqdHtml = await vqdResponse.text();
    
    // Extract vqd token from the HTML response
    const vqdMatch = vqdHtml.match(/vqd=['"]([^'"]+)['"]/);
    
    if (!vqdMatch || !vqdMatch[1]) {
      console.error('Could not extract vqd token');
      return new Response(
        JSON.stringify({ error: 'Could not obtain search token', imageUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vqd = vqdMatch[1];
    console.log(`Obtained vqd token: ${vqd}`);

    // Step 2: Search for images using the vqd token
    const imageSearchUrl = `https://duckduckgo.com/i.js?q=${encodedQuery}&vqd=${vqd}&o=json&p=1&s=0`;
    
    const imageResponse = await fetch(imageSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://duckduckgo.com/'
      }
    });

    const imageData = await imageResponse.json();
    
    // Extract first image URL
    if (imageData.results && imageData.results.length > 0) {
      const firstImage = imageData.results[0].image;
      console.log(`Found image: ${firstImage}`);
      
      return new Response(
        JSON.stringify({ imageUrl: firstImage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No images found in results');
      return new Response(
        JSON.stringify({ imageUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in car-image-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, imageUrl: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
