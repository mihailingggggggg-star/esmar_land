import { MemoryStore } from "./memory";
import { PgStore } from "./postgres";
import type { Store } from "./types";

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  store = process.env.DATABASE_URL ? new PgStore() : new MemoryStore();
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
    console.warn(
      "[esmar] DATABASE_URL is not set — falling back to in-memory storage. Attribution will not survive cold starts. Set DATABASE_URL before running ads.",
    );
  }
  return store;
}

export type { EventRow, Lead, LeadStatus, Store } from "./types";
