# parse-preferences verification notes

## Environment

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are sourced from `.env` for local verification calls.

## Commands attempted

- `supabase functions list`
  - Result: `supabase` CLI not installed in the container.
- `npx supabase functions list`
  - Result: blocked by registry access (npm 403).
- `curl -i "$VITE_SUPABASE_URL/functions/v1/parse-preferences" \
  -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
  -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  --data '{"userInput":"sporty sedan"}'`
  - Result: network tunnel blocked (HTTP 403 from proxy).

## Suggested manual checks

- Supabase dashboard → Edge Functions → confirm `parse-preferences` is deployed.
- Ensure `OPENAI_API_KEY` is set for the project if you want the OpenAI parsing path; otherwise the function falls back to heuristics.
- Re-run the curl request above from a network that can reach `*.supabase.co` to confirm a 200 response with JSON keys: `budgetLow`, `budgetHigh`, `bodyStyle`, `priorities`.
