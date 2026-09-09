import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";

export interface DbHandle {
  db: Database.Database;
  close(): void;
}

const SEED_WEBSITES: Array<{ displayName: string; launchUrl: string }> = [
  { displayName: "Steam", launchUrl: "https://store.steampowered.com/" },
  { displayName: "CSFloat", launchUrl: "https://csfloat.com/" },
  { displayName: "CSGOEmpire", launchUrl: "https://csgoempire.com/roulette" },
  { displayName: "CS.MONEY", launchUrl: "https://cs.money/tr/market/sell/" },
  { displayName: "skins.com", launchUrl: "https://skins.com/" },
  { displayName: "Lis Skins", launchUrl: "https://lis-skins.com/" },
  { displayName: "500casino", launchUrl: "https://csgo500.com/" },
  { displayName: "CSGORoll", launchUrl: "https://www.csgoroll.com/" },
];

const CATALOG_SEED_VERSION = 1;

/**
 * Opens (creating if necessary) the SQLite database at `dbPath`, applies
 * migrations, and seeds the default website catalog exactly once. Later
 * runs never re-add entries a user has intentionally deleted, because the
 * seed is gated on `settings.catalog_seed_version`, not on row absence.
 */
export function openDatabase(dbPath: string): DbHandle {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const migrationsDir = path.join(__dirname, "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set<string>();
  const metaExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'")
    .get();
  if (metaExists) {
    for (const row of db.prepare("SELECT key FROM schema_meta").all() as { key: string }[]) {
      applied.add(row.key);
    }
  }

  const applyMigration = db.transaction((file: string) => {
    const key = file.replace(/\.sql$/, "");
    if (applied.has(key)) return;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    db.exec(sql);
  });

  for (const file of migrationFiles) {
    applyMigration(file);
  }

  seedCatalogIfNeeded(db);

  return {
    db,
    close: () => db.close(),
  };
}

function seedCatalogIfNeeded(db: Database.Database): void {
  const settingsRow = db.prepare("SELECT * FROM settings LIMIT 1").get() as
    | { schema_version: number; catalog_seed_version: number }
    | undefined;

  if (settingsRow && settingsRow.catalog_seed_version >= CATALOG_SEED_VERSION) {
    return; // already seeded (or intentionally left at current version)
  }

  const insertWebsite = db.prepare(
    `INSERT INTO websites (id, display_name, launch_url, match_config, icon_cache_path, icon_source, catalog_position, created_at, updated_at)
     VALUES (@id, @displayName, @launchUrl, @matchConfig, NULL, 'none', @position, @now, @now)`
  );

  const seed = db.transaction(() => {
    const now = new Date().toISOString();
    SEED_WEBSITES.forEach((w, index) => {
      const url = new URL(w.launchUrl);
      const origin = `${url.protocol}//${url.hostname}${url.port ? ":" + url.port : ""}`.toLowerCase();
      insertWebsite.run({
        id: cryptoRandomUuid(),
        displayName: w.displayName,
        launchUrl: w.launchUrl,
        matchConfig: JSON.stringify({ origin, pathMode: "any", preserveQuery: false }),
        position: index,
        now,
      });
    });

    if (settingsRow) {
      db.prepare("UPDATE settings SET catalog_seed_version = ?").run(CATALOG_SEED_VERSION);
    } else {
      db.prepare("INSERT INTO settings (schema_version, catalog_seed_version) VALUES (1, ?)").run(
        CATALOG_SEED_VERSION
      );
    }
  });

  seed();
}

function cryptoRandomUuid(): string {
  // Node 18+ exposes global crypto.randomUUID(); fall back defensively.
  const g = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return require("node:crypto").randomUUID();
}
