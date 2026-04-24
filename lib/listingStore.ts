import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { DealAnalysis, ListingInput } from "./types";

export interface SavedListingRecord {
  id: string;
  createdAt: string;
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

async function ensureListingsTable() {
  const sql = getSql();
  await sql`
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
    )
  `;
  await sql`create index if not exists listings_created_at_idx on listings (created_at desc)`;
  await sql`create index if not exists listings_category_idx on listings (category)`;
  await sql`create index if not exists listings_title_idx on listings (title)`;
}

function normalizeRecord(row: {
  id: string;
  created_at: string | Date;
  input_json: ListingInput | string;
  analysis_json: DealAnalysis | string;
}): SavedListingRecord {
  return {
    id: row.id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
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

  const rows = await sql`
    insert into listings (
      id,
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
    returning id, created_at, input_json, analysis_json
  `;

  return normalizeRecord(rows[0] as Parameters<typeof normalizeRecord>[0]);
}

async function getListingRecordsFromPostgres(limit: number) {
  await ensureListingsTable();
  const sql = getSql();
  const rows = await sql`
    select id, created_at, input_json, analysis_json
    from listings
    order by created_at desc
    limit ${limit}
  `;

  return rows.map((row) => normalizeRecord(row as Parameters<typeof normalizeRecord>[0]));
}

export async function saveListingRecord(input: ListingInput, analysis: DealAnalysis) {
  if (hasPostgresDatabase()) return saveListingRecordToPostgres(input, analysis);

  await mkdir(DATA_DIR, { recursive: true });

  const record: SavedListingRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    analysis,
  };

  await appendFile(LISTINGS_FILE, `${JSON.stringify(record)}\n`, "utf8");
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
