-- Făgăraș aggregator schema. Run in Supabase SQL editor.
-- One row per source listing (dedup/merge happens at read time, same logic as
-- src/lib/sources/aggregate.ts). Price changes are tracked in price_history.

create table if not exists listings (
  external_id        text primary key,         -- e.g. olx-123, storia-456, publi24-xxx
  source             text not null,            -- OLX | Publi24 | Storia
  url                text not null,
  title              text not null default '',
  description        text not null default '',
  price              numeric,
  currency           text not null default 'EUR',
  surface_m2         numeric,
  land_surface_m2    numeric,
  rooms              integer,
  floor              integer,
  city               text,
  property_type      text not null,            -- apartament | casa | teren | garsoniera | spatiu_comercial
  transaction_type   text not null,            -- vanzare | inchiriere
  owner_type         text not null,            -- PF | AG | unknown
  owner_name         text,
  phone              text,
  images             jsonb not null default '[]',
  lat                numeric,
  lon                numeric,
  posted_at          timestamptz,
  first_seen_at      timestamptz not null default now(),
  last_seen_at       timestamptz not null default now()
);

create index if not exists listings_last_seen_idx on listings (last_seen_at desc);
create index if not exists listings_owner_type_idx on listings (owner_type);
create index if not exists listings_first_seen_idx on listings (first_seen_at desc);

-- Price observations over time (one row inserted whenever a listing's price changes).
create table if not exists price_history (
  id           bigint generated always as identity primary key,
  external_id  text not null references listings (external_id) on delete cascade,
  price        numeric not null,
  currency     text not null default 'EUR',
  observed_at  timestamptz not null default now()
);

create index if not exists price_history_external_idx on price_history (external_id, observed_at);

-- CRM leads. Persisted Kanban state, keyed to a listing.
create table if not exists leads (
  id               uuid primary key default gen_random_uuid(),
  external_id      text references listings (external_id) on delete set null,
  title            text not null default '',
  price            numeric,
  currency         text not null default 'EUR',
  city             text,
  owner_name       text,
  owner_phone      text,
  owner_type       text,
  status           text not null default 'Nou',  -- Nou | Necontactat | Contactat | Programare | Negociere | Contract | Pierdut
  priority         text not null default 'medium',
  assigned_to      text not null default 'Nealocat',
  notes            text not null default '',
  next_followup_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists leads_status_idx on leads (status);

-- Server-only access (ingestion + reads use the service-role key). RLS on with
-- no public policies = locked to the service role; safe by default.
alter table listings enable row level security;
alter table price_history enable row level security;
alter table leads enable row level security;
