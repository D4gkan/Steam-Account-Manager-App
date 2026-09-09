import React from "react";
import { Website } from "../../domain/types";

export interface WebsiteCatalogProps {
  websites: Website[]; // in persistent catalog display order
  selectionOrder: string[]; // website IDs in temporary click order
  onToggle: (websiteId: string) => void;
}

/**
 * Clicking a card only ever toggles temporary launch selection -- it never
 * opens the website immediately. Catalog display order (persistent, from
 * `websites` prop order) is intentionally independent from selection/click
 * order (shown via the numbered badge).
 */
export function WebsiteCatalog(props: WebsiteCatalogProps): JSX.Element {
  return (
    <div className="catalog" role="list" aria-label="Website catalog">
      {props.websites.map((site) => {
        const orderIndex = props.selectionOrder.indexOf(site.id);
        const isSelected = orderIndex !== -1;
        return (
          <button
            key={site.id}
            className={`website-card${isSelected ? " selected" : ""}`}
            onClick={() => props.onToggle(site.id)}
            role="listitem"
            aria-pressed={isSelected}
            aria-label={`${site.displayName}${isSelected ? `, selected, position ${orderIndex + 1}` : ""}`}
          >
            {isSelected && <span className="website-badge">{orderIndex + 1}</span>}
            {site.iconCachePath ? (
              <img
                src={site.iconCachePath}
                alt=""
                width={32}
                height={32}
                style={{ borderRadius: 6 }}
              />
            ) : (
              <div className="avatar" style={{ width: 32, height: 32 }} aria-hidden>{site.displayName[0].toUpperCase()}</div>
            )}
            <span>{site.displayName}</span>
          </button>
        );
      })}
    </div>
  );
}
