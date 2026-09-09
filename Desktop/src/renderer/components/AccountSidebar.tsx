import React, { useEffect, useMemo, useRef, useState } from "react";
import { Account, BrowserState } from "../../domain/types";

export interface AccountSidebarProps {
  accounts: Account[];
  browserStates: Record<string, BrowserState>;
  selectedAccountId: string | null;
  checkedAccountIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onAddAccount: () => void;
  onCopySteamId: (steamId64: string) => Promise<void>;
}

/**
 * Left sidebar: cached avatar, custom label (or Steam name), SteamID64
 * with copy action, and browser open/closed/unknown status. A visible
 * browser is never presented as proof every website is logged in -- the
 * dot only reflects browser process state, and its tooltip says so.
 */
export function AccountSidebar(props: AccountSidebarProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.accounts;
    return props.accounts.filter((a) => {
      return (
        (a.steamName ?? "").toLowerCase().includes(q) ||
        (a.customLabel ?? "").toLowerCase().includes(q) ||
        (a.steamId64 ?? "").includes(q)
      );
    });
  }, [props.accounts, query]);

  return (
    <div className="sidebar" role="navigation" aria-label="Accounts">
      <div style={{ padding: 12, display: "flex", gap: 8 }}>
        <input
          aria-label="Search accounts"
          placeholder="Search accounts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text)",
            padding: "6px 8px",
          }}
        />
        <button className="btn-secondary" onClick={props.onAddAccount}>
          + Add
        </button>
      </div>

      {filtered.map((account) => {
        const primaryLabel = account.customLabel ?? account.steamName ?? "Unnamed account";
        const secondaryLabel = account.customLabel && account.steamName ? account.steamName : null;
        const state = props.browserStates[account.id] ?? "unknown";
        const isSelected = props.selectedAccountId === account.id;

        return (
          <div
            key={account.id}
            className={`account-row${isSelected ? " selected" : ""}`}
            onClick={() => props.onSelect(account.id)}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); props.onSelect(account.id); }
            }}
          >
            <input
              type="checkbox"
              checked={props.checkedAccountIds.has(account.id)}
              onClick={(e) => e.stopPropagation()}
              onChange={() => props.onToggleCheck(account.id)}
              aria-label={`Select ${primaryLabel} for multi-account launch`}
            />
            {account.avatarCachePath ? (
              <img className="avatar" src={account.avatarCachePath} alt="" />
            ) : (
              <div className="avatar letter-icon" aria-hidden>{primaryLabel[0].toUpperCase()}</div>
            )}
            <div className="account-meta">
              <div className="account-name">{primaryLabel}</div>
              {secondaryLabel && <div className="account-subname">{secondaryLabel}</div>}
              <div className="account-subname">Browser {state}</div>
              {account.steamId64 && (
                <div className="account-steamid">
                  {account.steamId64}{" "}
                  <button
                    className="btn-secondary"
                    style={{ padding: "0 4px", fontSize: 10 }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await props.onCopySteamId(account.steamId64!);
                        clearTimeout(copyTimer.current);
                        setCopied(account.id);
                        copyTimer.current = setTimeout(() => setCopied(null), 1000);
                      } catch { /* The parent displays a copy failure. */ }
                    }}
                    aria-label={copied === account.id ? "Copied" : "Copy SteamID64"}
                    aria-live="polite"
                  >
                    {copied === account.id ? "Copied" : "copy"}
                  </button>
                </div>
              )}
            </div>
            <span
              className={`status-dot ${state === "open" ? "open" : state === "closed" ? "closed" : "unknown"}`}
              title={`Browser: ${state}. This reflects whether the account's browser process is running -- not whether any particular website session is logged in.`}
            />
          </div>
        );
      })}
    </div>
  );
}
