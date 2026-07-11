-- Listings Table
create table listings (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  price numeric not null,
  type text not null,
  area text not null,
  phone text not null,
  photo_urls text[] default '{}'
);

-- Profiles Table (linked to Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text check (role in ('Student', 'Landlord', 'Admin')) not null,
  phone text,
  status text default 'Active' check (status in ('Active', 'Blacklisted'))
);