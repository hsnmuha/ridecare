-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Table: motors
create table public.motors (
  id uuid default gen_random_uuid() primary key,
  nama_motor text not null,
  merek text,
  model text,
  tahun bigint,
  no_polisi text unique,
  created_at timestamp with time zone default now()
);

-- 2. Table: services
create table public.services (
  id uuid default gen_random_uuid() primary key,
  motor_id uuid references public.motors(id) on delete cascade,
  jenis_perawatan text not null,
  tanggal_perawatan date,
  odometer_saat_ganti bigint,
  biaya bigint,
  nama_bengkel text,
  detail_spesifik text,
  receipt_url text,
  jadwal_berikutnya_km bigint,
  jadwal_berikutnya_tanggal date,
  created_at timestamp with time zone default now()
);

-- 3. Table: odometers
create table public.odometers (
  id uuid default gen_random_uuid() primary key,
  motor_id uuid references public.motors(id) on delete cascade,
  tanggal_catat timestamp with time zone,
  nilai_odometer bigint,
  created_at timestamp with time zone default now()
);

-- 4. Storage Bucket Setup
-- Note: This requires the storage extension to be enabled (usually enabled by default).
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- SECURITY POLICIES (RLS)
-- Since the app currently does not have Auth, we will enable public access.
-- WARNING: This allows anyone with your Anon Key to read/write. 
-- You should implement Supabase Auth later for security.

-- Enable RLS on tables
alter table public.motors enable row level security;
alter table public.services enable row level security;
alter table public.odometers enable row level security;

-- Create Policies for Anonymous Access (CRUD)

-- Motors
create policy "Allow generic access to motors"
on public.motors for all
using (true)
with check (true);

-- Services
create policy "Allow generic access to services"
on public.services for all
using (true)
with check (true);

-- Odometers
create policy "Allow generic access to odometers"
on public.odometers for all
using (true)
with check (true);

-- Storage Policies
-- Allow public uploads and reads
create policy "Public Access to Receipts"
on storage.objects for all
using ( bucket_id = 'receipts' )
with check ( bucket_id = 'receipts' );
