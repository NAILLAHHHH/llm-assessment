import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { TriageTicket } from "./schemas/triage";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS triage_tickets (
        id TEXT PRIMARY KEY,
        raw_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        parse_status TEXT NOT NULL,
        parse_warnings TEXT NOT NULL,
        payload TEXT NOT NULL
      )
    `);
  }
  return db;
}

export function saveTicket(ticket: TriageTicket): void {
  const { id, rawText, createdAt, parseStatus, parseWarnings, ...payload } =
    ticket;
  getDb()
    .prepare(
      `INSERT INTO triage_tickets (id, raw_text, created_at, parse_status, parse_warnings, payload)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      rawText,
      createdAt,
      parseStatus,
      JSON.stringify(parseWarnings),
      JSON.stringify(payload),
    );
}

export function listTickets(filters?: {
  category?: string;
  priority?: string;
  search?: string;
}): TriageTicket[] {
  const rows = getDb()
    .prepare(
      `SELECT id, raw_text, created_at, parse_status, parse_warnings, payload
       FROM triage_tickets ORDER BY created_at DESC`,
    )
    .all() as {
    id: string;
    raw_text: string;
    created_at: string;
    parse_status: string;
    parse_warnings: string;
    payload: string;
  }[];

  return rows
    .map((row) => {
      const payload = JSON.parse(row.payload) as Omit<
        TriageTicket,
        "id" | "rawText" | "createdAt" | "parseStatus" | "parseWarnings"
      >;
      return {
        id: row.id,
        rawText: row.raw_text,
        createdAt: row.created_at,
        parseStatus: row.parse_status as TriageTicket["parseStatus"],
        parseWarnings: JSON.parse(row.parse_warnings) as string[],
        ...payload,
      };
    })
    .filter((ticket) => {
      if (filters?.category && ticket.category !== filters.category) return false;
      if (filters?.priority && ticket.priority !== filters.priority) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const haystack = [
          ticket.rawText,
          ticket.issueSummary,
          ticket.suggestedReply,
          ticket.customerName ?? "",
          ticket.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
}
