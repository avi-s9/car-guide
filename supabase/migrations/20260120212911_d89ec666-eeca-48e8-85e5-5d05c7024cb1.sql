-- Add new columns for enriched car data
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS msrp INTEGER,
ADD COLUMN IF NOT EXISTS comfort_score REAL,
ADD COLUMN IF NOT EXISTS sportiness_score REAL;

-- Create unique constraint for upsert on (make, model, year, transmission, drive)
CREATE UNIQUE INDEX IF NOT EXISTS cars_make_model_year_trans_drive_idx 
ON public.cars (make, model, year, transmission, drive);