create table if not exists listings (
  id text primary key,
  created_at timestamptz not null default now(),
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

create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_category_idx on listings (category);
create index if not exists listings_title_idx on listings (title);
