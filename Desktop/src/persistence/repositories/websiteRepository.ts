import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { IconSource, Website, WebsiteId, WebsiteMatchConfig } from "../../domain/types";
import { buildMatchConfigFromUrl, isSafeLaunchUrl } from "../../domain/validation";

interface WebsiteRow {
  id: string;
  display_name: string;
  launch_url: string;
  match_config: string;
  icon_cache_path: string | null;
  icon_source: IconSource;
  catalog_position: number;
  created_at: string;
  updated_at: string;
}

function rowToWebsite(row: WebsiteRow): Website {
  return {
    id: row.id,
    displayName: row.display_name,
    launchUrl: row.launch_url,
    matchConfig: JSON.parse(row.match_config) as WebsiteMatchConfig,
    iconCachePath: row.icon_cache_path,
    iconSource: row.icon_source,
    catalogPosition: row.catalog_position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class WebsiteRepository {
  constructor(private db: Database.Database) {}

  listAll(): Website[] {
    const rows = this.db
      .prepare("SELECT * FROM websites ORDER BY catalog_position ASC")
      .all() as WebsiteRow[];
    return rows.map(rowToWebsite);
  }

  findById(id: WebsiteId): Website | null {
    const row = this.db.prepare("SELECT * FROM websites WHERE id = ?").get(id) as
      | WebsiteRow
      | undefined;
    return row ? rowToWebsite(row) : null;
  }

  add(displayName: string, launchUrl: string): Website {
    if (!isSafeLaunchUrl(launchUrl)) {
      throw new Error("Launch URL must use http:// or https://");
    }
    const maxPos = this.db
      .prepare("SELECT COALESCE(MAX(catalog_position), -1) AS maxPos FROM websites")
      .get() as { maxPos: number };
    const now = new Date().toISOString();
    const website: Website = {
      id: randomUUID(),
      displayName,
      launchUrl,
      matchConfig: buildMatchConfigFromUrl(launchUrl),
      iconCachePath: null,
      iconSource: "none",
      catalogPosition: maxPos.maxPos + 1,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO websites (id, display_name, launch_url, match_config, icon_cache_path, icon_source, catalog_position, created_at, updated_at)
         VALUES (@id, @displayName, @launchUrl, @matchConfig, NULL, 'none', @catalogPosition, @createdAt, @updatedAt)`
      )
      .run({ ...website, matchConfig: JSON.stringify(website.matchConfig) });
    return website;
  }

  updateIcon(id: WebsiteId, iconCachePath: string, source: IconSource): void {
    this.db
      .prepare(
        `UPDATE websites SET icon_cache_path = ?, icon_source = ?, updated_at = ? WHERE id = ?`
      )
      .run(iconCachePath, source, new Date().toISOString(), id);
  }

  rename(id: WebsiteId, displayName: string): void {
    this.db
      .prepare(`UPDATE websites SET display_name = ?, updated_at = ? WHERE id = ?`)
      .run(displayName, new Date().toISOString(), id);
  }

  reorder(orderedIds: WebsiteId[]): void {
    const stmt = this.db.prepare(`UPDATE websites SET catalog_position = ? WHERE id = ?`);
    const tx = this.db.transaction((ids: WebsiteId[]) => {
      const current = this.listAll().map(w => w.id);
      if (ids.length !== current.length || new Set(ids).size !== ids.length || ids.some(id => !current.includes(id))) throw new Error('Catalog order must contain every website exactly once');
      ids.forEach((id, index) => stmt.run(index, id));
    });
    tx(orderedIds);
  }

  edit(id: WebsiteId, displayName: string, launchUrl: string): void {
    if (!isSafeLaunchUrl(launchUrl) || !displayName.trim() || !this.findById(id)) throw new Error('Invalid website');
    this.db.prepare('UPDATE websites SET display_name = ?, launch_url = ?, match_config = ?, updated_at = ? WHERE id = ?')
      .run(displayName, launchUrl, JSON.stringify(buildMatchConfigFromUrl(launchUrl)), new Date().toISOString(), id);
  }

  remove(id: WebsiteId): void {
    // Removing a catalog item never touches existing browser tabs/sessions --
    // that's a live-browser concern handled by launch/tabMatcher, not persistence.
    this.db.prepare(`DELETE FROM websites WHERE id = ?`).run(id);
  }
}
