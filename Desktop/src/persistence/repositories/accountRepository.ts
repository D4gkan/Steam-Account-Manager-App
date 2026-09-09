import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { Account, AccountId, OnboardingStatus } from "../../domain/types";
import { isValidSteamId64 } from '../../domain/validation';

interface AccountRow {
  id: string;
  steam_id64: string | null;
  steam_name: string | null;
  custom_label: string | null;
  avatar_cache_path: string | null;
  profile_relative_path: string;
  onboarding_status: OnboardingStatus;
  created_at: string;
  metadata_updated_at: string | null;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    steamId64: row.steam_id64,
    steamName: row.steam_name,
    customLabel: row.custom_label,
    avatarCachePath: row.avatar_cache_path,
    profileRelativePath: row.profile_relative_path,
    onboardingStatus: row.onboarding_status,
    createdAt: row.created_at,
    metadataUpdatedAt: row.metadata_updated_at,
  };
}

export class AccountRepository {
  constructor(private db: Database.Database) {}

  createPending(): Account {
    const now = new Date().toISOString();
    const account: Account = {
      id: randomUUID(),
      steamId64: null,
      steamName: null,
      customLabel: null,
      avatarCachePath: null,
      profileRelativePath: randomUUID(),
      onboardingStatus: "pending_login",
      createdAt: now,
      metadataUpdatedAt: null,
    };
    this.db
      .prepare(
        `INSERT INTO accounts (id, steam_id64, steam_name, custom_label, avatar_cache_path, profile_relative_path, onboarding_status, created_at, metadata_updated_at)
         VALUES (@id, NULL, NULL, NULL, NULL, @profileRelativePath, @onboardingStatus, @createdAt, NULL)`
      )
      .run(account);
    return account;
  }

  findById(id: AccountId): Account | null {
    const row = this.db.prepare("SELECT * FROM accounts WHERE id = ?").get(id) as
      | AccountRow
      | undefined;
    return row ? rowToAccount(row) : null;
  }

  findBySteamId64(steamId64: string): Account | null {
    const row = this.db.prepare("SELECT * FROM accounts WHERE steam_id64 = ?").get(steamId64) as
      | AccountRow
      | undefined;
    return row ? rowToAccount(row) : null;
  }

  listAll(): Account[] {
    const rows = this.db.prepare("SELECT * FROM accounts ORDER BY created_at ASC").all() as AccountRow[];
    return rows.map(rowToAccount);
  }

  confirmIdentity(id: AccountId, steamId64: string, steamName: string, avatarCachePath: string | null): void {
    if (typeof steamId64 !== 'string' || !isValidSteamId64(steamId64)) throw new Error('Invalid SteamID64 string');
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE accounts
         SET steam_id64 = @steamId64, steam_name = @steamName, avatar_cache_path = @avatarCachePath,
             onboarding_status = 'confirmed', metadata_updated_at = @now
         WHERE id = @id`
      )
      .run({ id, steamId64, steamName, avatarCachePath, now });
  }

  markDetectionFailed(id: AccountId): void {
    this.db.prepare(`UPDATE accounts SET onboarding_status = 'detection_failed' WHERE id = ?`).run(id);
  }

  markMismatched(id: AccountId): void {
    this.db.prepare(`UPDATE accounts SET onboarding_status = 'mismatched' WHERE id = ?`).run(id);
  }

  refreshMetadata(id: AccountId, steamName: string, avatarCachePath: string | null): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE accounts SET steam_name = @steamName, avatar_cache_path = @avatarCachePath, metadata_updated_at = @now WHERE id = @id`
      )
      .run({ id, steamName, avatarCachePath, now });
  }

  setCustomLabel(id: AccountId, label: string | null): void {
    this.db.prepare(`UPDATE accounts SET custom_label = ? WHERE id = ?`).run(label, id);
  }

  delete(id: AccountId): void {
    this.db.prepare(`DELETE FROM accounts WHERE id = ?`).run(id);
  }
}
