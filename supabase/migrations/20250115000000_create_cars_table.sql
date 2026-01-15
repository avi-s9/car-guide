create table if not exists public.cars (
  id text primary key,
  year int not null,
  make text not null,
  model text not null,
  vehicle_class text null,
  fuel_type text null,
  drive text null,
  transmission text null,
  city_mpg float null,
  highway_mpg float null,
  combined_mpg float null,
  co2_gpm float null,
  created_at timestamptz not null default now()
);

create index if not exists cars_year_idx on public.cars (year);
create index if not exists cars_make_model_idx on public.cars (make, model);
create index if not exists cars_vehicle_class_idx on public.cars (vehicle_class);
