import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { DealAnalysis, ListingInput } from "./types";

export interface SavedListingRecord {
  id: string;
  createdAt: string;
  lastSeenAt?: string;
  seenCount?: number;
  input: ListingInput;
  analysis: DealAnalysis;
}

const DATA_DIR = path.join(process.cwd(), "data");
const LISTINGS_FILE = path.join(DATA_DIR, "listings.jsonl");
const DATABASE_URL = process.env.DATABASE_URL;

function hasPostgresDatabase() {
  return Boolean(DATABASE_URL);
}

function getSql() {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(DATABASE_URL);
}

function normalizeKeyPart(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function buildListingKey(input: ListingInput) {
  if (input.listingUrl?.trim()) return `url:${normalizeKeyPart(input.listingUrl)}`;

  return [
    "manual",
    normalizeKeyPart(input.category),
    normalizeKeyPart(input.title),
    normalizeKeyPart(input.askingPrice),
    normalizeKeyPart(input.currency),
    normalizeKeyPart(input.location),
  ].join(":");
}

async function ensureListingsTable() {
  const sql = getSql();
  await sql`
    create table if not exists listings (
      id text primary key,
      listing_key text unique,
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
    )
  `;
  await sql`alter table listings add column if not exists listing_key text`;
  await sql`alter table listings add column if not exists last_seen_at timestamptz not null default now()`;
  await sql`alter table listings add column if not exists seen_count integer not null default 1`;
  await sql`update listings set listing_key = id where listing_key is null`;
  await sql`alter table listings alter column listing_key set not null`;
  await sql`create index if not exists listings_created_at_idx on listings (created_at desc)`;
  await sql`create index if not exists listings_last_seen_at_idx on listings (last_seen_at desc)`;
  await sql`create index if not exists listings_category_idx on listings (category)`;
  await sql`create index if not exists listings_title_idx on listings (title)`;
  await sql`create unique index if not exists listings_listing_key_idx on listings (listing_key)`;
}

function normalizeRecord(row: {
  id: string;
  created_at: string | Date;
  last_seen_at?: string | Date;
  seen_count?: number;
  input_json: ListingInput | string;
  analysis_json: DealAnalysis | string;
}): SavedListingRecord {
  return {
    id: row.id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    lastSeenAt: row.last_seen_at
      ? row.last_seen_at instanceof Date
        ? row.last_seen_at.toISOString()
        : new Date(row.last_seen_at).toISOString()
      : undefined,
    seenCount: row.seen_count,
    input:
      typeof row.input_json === "string"
        ? (JSON.parse(row.input_json) as ListingInput)
        : row.input_json,
    analysis:
      typeof row.analysis_json === "string"
        ? (JSON.parse(row.analysis_json) as DealAnalysis)
        : row.analysis_json,
  };
}

async function saveListingRecordToPostgres(input: ListingInput, analysis: DealAnalysis) {
  await ensureListingsTable();
  const sql = getSql();
  const id = randomUUID();
  const listingKey = buildListingKey(input);

  const rows = await sql`
    insert into listings (
      id,
      listing_key,
      listing_url,
      title,
      category,
      asking_price,
      currency,
      location,
      seller_verified,
      seller_type,
      listing_text,
      seller_notes,
      comparable_listings,
      input_json,
      analysis_json
    ) values (
      ${id},
      ${listingKey},
      ${input.listingUrl ?? null},
      ${input.title},
      ${input.category},
      ${input.askingPrice},
      ${input.currency},
      ${input.location || null},
      ${input.sellerVerified ?? null},
      ${input.sellerType ?? null},
      ${input.listingText},
      ${input.sellerNotes || null},
      ${input.comparableListings || null},
      ${JSON.stringify(input)}::jsonb,
      ${JSON.stringify(analysis)}::jsonb
    )
    on conflict (listing_key) do update set
      last_seen_at = now(),
      seen_count = listings.seen_count + 1,
      listing_url = coalesce(excluded.listing_url, listings.listing_url),
      title = excluded.title,
      category = excluded.category,
      asking_price = excluded.asking_price,
      currency = excluded.currency,
      location = excluded.location,
      seller_verified = excluded.seller_verified,
      seller_type = excluded.seller_type,
      listing_text = excluded.listing_text,
      seller_notes = excluded.seller_notes,
      comparable_listings = excluded.comparable_listings,
      input_json = excluded.input_json,
      analysis_json = excluded.analysis_json
    returning id, created_at, last_seen_at, seen_count, input_json, analysis_json
  `;

  return normalizeRecord(rows[0] as Parameters<typeof normalizeRecord>[0]);
}

async function getListingRecordsFromPostgres(limit: number) {
  await ensureListingsTable();
  const sql = getSql();
  const rows = await sql`
    select id, created_at, last_seen_at, seen_count, input_json, analysis_json
    from listings
    order by last_seen_at desc
    limit ${limit}
  `;

  return rows.map((row) => normalizeRecord(row as Parameters<typeof normalizeRecord>[0]));
}

export async function saveListingRecord(input: ListingInput, analysis: DealAnalysis) {
  if (hasPostgresDatabase()) return saveListingRecordToPostgres(input, analysis);

  await mkdir(DATA_DIR, { recursive: true });
  const now = new Date().toISOString();
  const id = buildListingKey(input);
  const records = await getListingRecords(Number.MAX_SAFE_INTEGER);
  const existingIndex = records.findIndex((record) => record.id === id);

  const record: SavedListingRecord = {
    id,
    createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : now,
    lastSeenAt: now,
    seenCount: existingIndex >= 0 ? (records[existingIndex].seenCount ?? 1) + 1 : 1,
    input,
    analysis,
  };

  if (existingIndex >= 0) records[existingIndex] = record;
  else records.unshift(record);

  await writeFile(
    LISTINGS_FILE,
    `${records.map((item) => JSON.stringify(item)).join("\n")}\n`,
    "utf8"
  );
  return record;
}

export async function getListingRecords(limit = 50): Promise<SavedListingRecord[]> {
  if (hasPostgresDatabase()) return getListingRecordsFromPostgres(limit);

  try {
    const contents = await readFile(LISTINGS_FILE, "utf8");
    return contents
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SavedListingRecord)
      .slice(-limit)
      .reverse();
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return [];
    throw err;
  }
}
