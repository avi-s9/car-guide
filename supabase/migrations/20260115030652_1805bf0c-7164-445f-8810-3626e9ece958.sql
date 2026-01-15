-- Create cars table for FuelEconomy.gov data
CREATE TABLE public.cars (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  vehicle_class TEXT,
  fuel_type TEXT,
  drive TEXT,
  transmission TEXT,
  city_mpg NUMERIC,
  highway_mpg NUMERIC,
  combined_mpg NUMERIC,
  co2_gpm NUMERIC
);

-- Enable Row Level Security
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Allow public read access (car data is not user-specific)
CREATE POLICY "Cars are publicly readable"
ON public.cars
FOR SELECT
USING (true);

-- Create indexes for common queries
CREATE INDEX idx_cars_make ON public.cars(make);
CREATE INDEX idx_cars_year ON public.cars(year);
CREATE INDEX idx_cars_fuel_type ON public.cars(fuel_type);
CREATE INDEX idx_cars_vehicle_class ON public.cars(vehicle_class);