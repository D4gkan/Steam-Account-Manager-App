import Database from "better-sqlite3";
import {
  AccountExtensionStatus,
  AccountId,
  ExtensionKey,
  ExtensionPackage,
  ExtensionStatus,
} from "../../domain/types";

interface PackageRow {
  extension_key: ExtensionKey;
  expected_legacy_id: string | null;
  actual_id: string | null;
  version: string | null;
  source: "publisher-package" | "supplied-custom-folder";
  digest: string | null;
  package_relative_path: string;
  compatibility_status: ExtensionStatus;
}

function rowToPackage(row: PackageRow): ExtensionPackage {
  return {
    key: row.extension_key,
    expectedLegacyId: row.expected_legacy_id,
    actualId: row.actual_id,
    version: row.version,
    source: row.source,
    digest: row.digest,
    packageRelativePath: row.package_relative_path,
    compatibilityStatus: row.compatibility_status,
  };
}

export class ExtensionRepository {
  constructor(private db: Database.Database) {}

  upsertPackage(pkg: ExtensionPackage): void {
    this.db
      .prepare(
        `INSERT INTO extension_packages (extension_key, expected_legacy_id, actual_id, version, source, digest, package_relative_path, compatibility_status)
         VALUES (@key, @expectedLegacyId, @actualId, @version, @source, @digest, @packageRelativePath, @compatibilityStatus)
         ON CONFLICT(extension_key) DO UPDATE SET
           expected_legacy_id = excluded.expected_legacy_id,
           actual_id = excluded.actual_id,
           version = excluded.version,
           source = excluded.source,
           digest = excluded.digest,
           package_relative_path = excluded.package_relative_path,
           compatibility_status = excluded.compatibility_status`
      )
      .run(pkg);
  }

  listPackages(): ExtensionPackage[] {
    const rows = this.db.prepare("SELECT * FROM extension_packages").all() as PackageRow[];
    return rows.map(rowToPackage);
  }

  setAccountExtensionStatus(status: AccountExtensionStatus): void {
    this.db
      .prepare(
        `INSERT INTO account_extension_status (account_id, extension_key, installed_version, verified_at, status, error_code)
         VALUES (@accountId, @extensionKey, @installedVersion, @verifiedAt, @status, @errorCode)
         ON CONFLICT(account_id, extension_key) DO UPDATE SET
           installed_version = excluded.installed_version,
           verified_at = excluded.verified_at,
           status = excluded.status,
           error_code = excluded.error_code`
      )
      .run(status);
  }

  listStatusForAccount(accountId: AccountId): AccountExtensionStatus[] {
    const rows = this.db
      .prepare("SELECT * FROM account_extension_status WHERE account_id = ?")
      .all(accountId) as Array<{
      account_id: AccountId;
      extension_key: ExtensionKey;
      installed_version: string | null;
      verified_at: string | null;
      status: ExtensionStatus;
      error_code: string | null;
    }>;
    return rows.map((r) => ({
      accountId: r.account_id,
      extensionKey: r.extension_key,
      installedVersion: r.installed_version,
      verifiedAt: r.verified_at,
      status: r.status,
      errorCode: r.error_code,
    }));
  }
}
