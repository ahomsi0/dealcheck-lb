create table if not exists listings (
  id text primary key,
  listing_key text unique not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  seen_count integer not null default 1,
  listing_url text,
  title text not null,
  category text not null,
  asking_price numeric not null,
  currency text not null,
  location text,
  seller_verified boolean,
  seller_type text,
  listing_text text,
  seller_notes text,
  comparable_listings text,
  input_json jsonb not null,
  analysis_json jsonb not null
);

alter table listings add column if not exists listing_key text;
alter table listings add column if not exists last_seen_at timestamptz not null default now();
alter table listings add column if not exists seen_count integer not null default 1;
update listings set listing_key = id where listing_key is null;
alter table listings alter column listing_key set not null;

create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_last_seen_at_idx on listings (last_seen_at desc);
create index if not exists listings_category_idx on listings (category);
create index if not exists listings_title_idx on listings (title);
create unique index if not exists listings_listing_key_idx on listings (listing_key);
