-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type user_role as enum (
  'adopter', 'shelter_admin', 'pet_owner', 'vet', 'clinic_admin'
);

create type animal_species as enum (
  'dog', 'cat', 'rabbit', 'bird', 'other'
);

create type animal_status as enum (
  'available', 'adopted', 'pending'
);

-- ─── users (extends Supabase auth.users) ─────────────────────────────────────

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role    not null default 'adopter',
  display_name text         not null,
  avatar_url   text,
  created_at   timestamptz  not null default now()
);

alter table public.users enable row level security;

create policy "users: read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id);

-- ─── shelters ────────────────────────────────────────────────────────────────

create table public.shelters (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid         not null references public.users(id),
  name          text         not null,
  location      text         not null,
  contact_email text         not null,
  description   text         not null default '',
  photo_urls    text[]       not null default '{}',
  created_at    timestamptz  not null default now()
);

alter table public.shelters enable row level security;

create policy "shelters: public read"
  on public.shelters for select
  using (true);

create policy "shelters: admin manages own shelter"
  on public.shelters for all
  using (auth.uid() = admin_id);

-- ─── animals ─────────────────────────────────────────────────────────────────

create table public.animals (
  id            uuid primary key default gen_random_uuid(),
  shelter_id    uuid           not null references public.shelters(id) on delete cascade,
  name          text           not null,
  species       animal_species not null,
  breed         text,
  age_months    int            not null check (age_months >= 0),
  description   text           not null default '',
  photo_urls    text[]         not null default '{}',
  health_status text           not null default '',
  status        animal_status  not null default 'available',
  created_at    timestamptz    not null default now()
);

create index animals_shelter_status_idx on public.animals (shelter_id, status);
create index animals_status_species_idx on public.animals (status, species);

alter table public.animals enable row level security;

create policy "animals: public read available"
  on public.animals for select
  using (true);

create policy "animals: shelter_admin manages own animals"
  on public.animals for all
  using (
    auth.uid() = (select admin_id from public.shelters where id = shelter_id)
  );

-- ─── adopter_profiles ────────────────────────────────────────────────────────

create type living_space_type as enum (
  'apartment', 'house_no_garden', 'house_with_garden'
);

create type activity_level_type as enum ('low', 'medium', 'high');
create type pet_experience_type as enum ('none', 'some', 'experienced');

create table public.adopter_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid                  not null unique references public.users(id) on delete cascade,
  living_space      living_space_type     not null,
  activity_level    activity_level_type   not null,
  pet_experience    pet_experience_type   not null,
  has_allergies     bool                  not null default false,
  other_pets        bool                  not null default false,
  preferred_species text[]                not null default '{}',
  updated_at        timestamptz           not null default now()
);

alter table public.adopter_profiles enable row level security;

create policy "adopter_profiles: own row only"
  on public.adopter_profiles for all
  using (auth.uid() = user_id);

-- ─── adopter_favourites ──────────────────────────────────────────────────────

create table public.adopter_favourites (
  id          uuid primary key default gen_random_uuid(),
  adopter_id  uuid        not null references public.users(id) on delete cascade,
  animal_id   uuid        not null references public.animals(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (adopter_id, animal_id)
);

create index adopter_favourites_adopter_idx on public.adopter_favourites (adopter_id);

alter table public.adopter_favourites enable row level security;

create policy "adopter_favourites: own rows only"
  on public.adopter_favourites for all
  using (auth.uid() = adopter_id);

-- ─── adoption_inquiries ──────────────────────────────────────────────────────

create type inquiry_status as enum ('pending', 'responded', 'closed');

create table public.adoption_inquiries (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid           not null references public.animals(id),
  adopter_id  uuid           not null references public.users(id),
  shelter_id  uuid           not null references public.shelters(id),
  message     text           not null,
  status      inquiry_status not null default 'pending',
  created_at  timestamptz    not null default now()
);

create index adoption_inquiries_shelter_status_idx on public.adoption_inquiries (shelter_id, status);

alter table public.adoption_inquiries enable row level security;

create policy "adoption_inquiries: adopter reads own"
  on public.adoption_inquiries for select
  using (auth.uid() = adopter_id);

create policy "adoption_inquiries: adopter creates"
  on public.adoption_inquiries for insert
  with check (auth.uid() = adopter_id);

create policy "adoption_inquiries: shelter_admin reads own shelter"
  on public.adoption_inquiries for select
  using (
    auth.uid() = (select admin_id from public.shelters where id = shelter_id)
  );

create policy "adoption_inquiries: shelter_admin updates own shelter"
  on public.adoption_inquiries for update
  using (
    auth.uid() = (select admin_id from public.shelters where id = shelter_id)
  );
