import React from "react";
import { Website } from "../../domain/types";

export interface SelectionStripProps {
  orderedWebsites: Website[]; // resolved from selectionOrder, in that order
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onRemove: (websiteId: string) => void;
  onClear: () => void;
}

/**
 * Visible ordered strip of the temporary launch selection, with
 * accessible move-left/right controls as an alternative to drag handles.
 * Removing an item renumbers the rest implicitly (order is derived from
 * array position, not a stored index).
 */
export function SelectionStrip(props: SelectionStripProps): JSX.Element {
  if (props.orderedWebsites.length === 0) {
    return (
      <div className="selection-strip" aria-live="polite">
        <span style={{ color: "var(--text-dim)" }}>No websites selected yet.</span>
      </div>
    );
  }

  return (
    <div className="selection-strip" role="list" aria-label="Selected websites, in launch order">
      {props.orderedWebsites.map((site, index) => (
        <div
          key={site.id}
          draggable
          onDragStart={e => e.dataTransfer.setData('text/plain', String(index))}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const from = Number(e.dataTransfer.getData('text/plain'));
            if (!Number.isInteger(from) || from < 0 || from >= props.orderedWebsites.length) return;
            if (from < index) for (let i = from; i < index; i++) props.onMoveRight(i);
            else for (let i = from; i > index; i--) props.onMoveLeft(i);
          }}
          role="listitem"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "4px 8px",
            flexShrink: 0,
          }}
        >
          <span title="Drag to reorder" aria-hidden>⠿</span><span style={{ color: "var(--text-dim)", fontSize: 12 }}>{index + 1}.</span>
          <span>{site.displayName}</span>
          <button
            className="btn-secondary"
            style={{ padding: "0 6px" }}
            disabled={index === 0}
            onClick={() => props.onMoveLeft(index)}
            aria-label={`Move ${site.displayName} earlier`}
          >
            ◀
          </button>
          <button
            className="btn-secondary"
            style={{ padding: "0 6px" }}
            disabled={index === props.orderedWebsites.length - 1}
            onClick={() => props.onMoveRight(index)}
            aria-label={`Move ${site.displayName} later`}
          >
            ▶
          </button>
          <button
            className="btn-secondary"
            style={{ padding: "0 6px" }}
            onClick={() => props.onRemove(site.id)}
            aria-label={`Remove ${site.displayName} from selection`}
          >
            ✕
          </button>
        </div>
      ))}
      <button className="btn-secondary" onClick={props.onClear}>
        Clear selection
      </button>
    </div>
  );
}
