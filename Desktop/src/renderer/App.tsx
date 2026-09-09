import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Account, Website, BrowserState, AccountLaunchResult } from '../domain/types';
import { AccountSidebar } from './components/AccountSidebar';
import { WebsiteCatalog } from './components/WebsiteCatalog';
import { SelectionStrip } from './components/SelectionStrip';
import { initialSelectionState, selectionReducer } from './state/store';
import appIcon from '../../app-icon.png';

const ICON_ERROR = "We couldn't fetch this website's icon. Please provide a PNG file.";
export function App(): JSX.Element {
  const api = window.steamAccountManager;
  const [accounts, setAccounts] = useState<Account[]>([]), [websites, setWebsites] = useState<Website[]>([]);
  const [selection, dispatch] = useReducer(selectionReducer, initialSelectionState);
  const [status, setStatus] = useState<{ setup: string; messages: Record<string, string>; browserStates: Record<string, BrowserState> }>({ setup: 'Loading…', messages: {}, browserStates: {} });
  const [error, setError] = useState(''), [busy, setBusy] = useState(''), [mode, setMode] = useState<'launch' | 'catalog' | 'diagnostics'>('launch');
  const [name, setName] = useState(''), [url, setUrl] = useState(''), [editing, setEditing] = useState<string | null>(null);
  const [label, setLabel] = useState(''), [iconFailures, setIconFailures] = useState<Record<string, string>>({});
  const [results, setResults] = useState<AccountLaunchResult[]>([]), [extensions, setExtensions] = useState<any[]>([]);
  const lock = useRef(false), iconAttempted = useRef(new Set<string>());
  const refresh = async () => { const [a, w, s] = await Promise.all([api.accounts.list(), api.websites.list(), api.status()]); setAccounts(a); setWebsites(w); setStatus(s); };
  const run = async (message: string, task: () => Promise<unknown>) => {
    if (lock.current) return; lock.current = true; setBusy(message); setError('');
    try { await task(); await refresh(); } catch (e) { setError(String((e as Error).message || e)); }
    finally { lock.current = false; setBusy(''); }
  };
  useEffect(() => { void refresh().catch(e => setError(String(e))); const timer = setInterval(() => void refresh().catch(() => {}), 3000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) { favicon = document.createElement('link'); favicon.rel = 'icon'; document.head.append(favicon); }
    favicon.href = appIcon;
  }, []);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (const w of websites) {
        if (cancelled) return;
        if (w.iconCachePath || iconAttempted.current.has(w.id)) continue;
        iconAttempted.current.add(w.id);
        try { const r = await api.websites.fetchIcon(w.id); if (!r.ok) setIconFailures(prev => ({ ...prev, [w.id]: ICON_ERROR })); else await refresh(); } catch { setIconFailures(prev => ({ ...prev, [w.id]: ICON_ERROR })); }
      }
    })();
    return () => { cancelled = true; };
  }, [websites.map(w => w.id).join(',')]);
  const current = accounts.find(a => a.id === selection.selectedAccountId);
  useEffect(() => setLabel(current?.customLabel || ''), [current?.id, current?.customLabel]);
  const ordered = selection.websiteSelectionOrder.flatMap(id => websites.filter(w => w.id === id));
  const targetIds = selection.checkedAccountIds.filter(id => accounts.some(a => a.id === id));
  const moveCatalog = (index: number, direction: number) => run('Saving catalog order…', async () => { const ids = websites.map(w => w.id); [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]]; await api.websites.reorder(ids); });
  const upload = (id: string) => run('Saving icon…', async () => { if (await api.websites.uploadIcon(id)) setIconFailures(prev => { const next = { ...prev }; delete next[id]; return next; }); });
  return <>
    <aside className="account-panel"><div className="brand"><img className="brand-mark" src={appIcon} alt="Steam Account Manager App" /><div>STEAM ACCOUNTS<small>LOCAL ACCOUNT MANAGER</small></div></div>
      <AccountSidebar accounts={accounts} browserStates={status.browserStates} selectedAccountId={selection.selectedAccountId} checkedAccountIds={new Set(targetIds)}
        onSelect={accountId => dispatch({ type: 'SELECT_ACCOUNT', accountId })} onToggleCheck={accountId => dispatch({ type: 'TOGGLE_ACCOUNT_CHECK', accountId })}
        onAddAccount={() => void run('Opening Steam login…', async () => { const a = await api.accounts.createPending(); dispatch({ type: 'SELECT_ACCOUNT', accountId: a.id }); })}
        onCopySteamId={async steamId => {
          try { const a = accounts.find(a => a.steamId64 === steamId); if (!a) throw Error(); await api.accounts.copyId(a.id); }
          catch { setError('Could not copy SteamID64. Please try again.'); throw Error('Copy failed'); }
        }} />
      {!accounts.length && <div className="empty-account"><h3>Your accounts, separated.</h3><p>Add an account to open Steam login in a fresh browser profile. Sign in manually, including Steam Guard.</p></div>}
      <div className="sidebar-foot">Sessions stay on this computer.<br />Closing the manager leaves browsers open.</div>
    </aside>
    <main className="main">
      <header className="app-header"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Steam Account Manager App</h1><p>Separate accounts. One shared website catalog.</p></div><span className="local-badge">● Local storage</span></header>
      <nav className="mode-nav" aria-label="Manager pages">{(['launch', 'catalog', 'diagnostics'] as const).map(m => <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{m === 'launch' ? 'Open websites' : m === 'catalog' ? 'Manage catalog' : 'Setup & diagnostics'}</button>)}</nav>
      {error && <div className="notice error" role="alert">{error}<button className="btn-secondary" onClick={() => setError('')}>Dismiss</button></div>}
      {busy && <div className="notice" role="status">{busy}<small>{status.setup !== 'Ready' ? status.setup : ''}</small></div>}
      {current && <section className="account-details"><div><strong>{current.customLabel || current.steamName || 'Pending Steam account'}</strong><span>{current.steamId64 || 'Awaiting manual Steam login'} · {current.onboardingStatus.replaceAll('_', ' ')}</span></div>
        <div className="account-actions"><input aria-label="Custom account label" placeholder="Custom label" maxLength={200} value={label} onChange={e => setLabel(e.target.value)} />
          <button className="btn-secondary" disabled={!!busy} onClick={() => void run('Saving label…', () => api.accounts.setCustomLabel(current.id, label || null))}>Save label</button>
          <button className="btn-secondary" disabled={!!busy} onClick={() => void run('Opening account and detecting identity…', () => api.accounts.retry(current.id))}>Retry / refresh identity</button>
          <button className="btn-secondary danger" disabled={!!busy} onClick={() => void run('Deleting local data…', () => api.accounts.delete(current.id))}>Delete</button></div>
        {status.messages[current.id] && <p className="account-message" role="status">{status.messages[current.id]}</p>}
      </section>}
      {mode === 'launch' && <>
        <div className="section-title"><div><h2>Choose your websites</h2><p>Click to select. Numbered badges show the tab order.</p></div><span>{websites.length} websites</span></div>
        <WebsiteCatalog websites={websites} selectionOrder={selection.websiteSelectionOrder} onToggle={websiteId => dispatch({ type: 'TOGGLE_WEBSITE', websiteId })} />
        <SelectionStrip orderedWebsites={ordered} onMoveLeft={index => dispatch({ type: 'MOVE_WEBSITE_LEFT', index })} onMoveRight={index => dispatch({ type: 'MOVE_WEBSITE_RIGHT', index })} onRemove={websiteId => dispatch({ type: 'REMOVE_WEBSITE', websiteId })} onClear={() => dispatch({ type: 'CLEAR_WEBSITE_SELECTION' })} />
        <footer className="launch-bar"><div><strong>{targetIds.length} accounts · {ordered.length} tabs each</strong><small>{targetIds.length * ordered.length} requested tabs · Existing matching tabs are reused.</small></div>
          <button className="btn-primary" disabled={!!busy || !targetIds.length || !ordered.length} onClick={() => void run('Opening selected websites…', async () => setResults(await api.launch({ accountIds: targetIds, orderedWebsiteIds: ordered.map(w => w.id) })))}>Open selected websites →</button></footer>
        {results.length > 0 && <div className="launch-results" role="status">{results.map(r => <div key={r.accountId}><strong>{accounts.find(a => a.id === r.accountId)?.customLabel || accounts.find(a => a.id === r.accountId)?.steamName || 'Pending account'}</strong>: {r.error || `${r.openedTabs.length} created, ${r.reusedTabs.length} reused`}{r.failedWebsites.map(w => <span key={w.websiteId}> · {w.reason}</span>)}</div>)}</div>}
      </>}
      {mode === 'catalog' && <div className="scroll-area">
        <div className="section-title"><div><h2>Shared website catalog</h2><p>Edits apply to all accounts. Catalog order is separate from launch order.</p></div></div>
        <form className="catalog-form" onSubmit={e => { e.preventDefault(); void run('Saving website…', async () => { if (editing) await api.websites.edit(editing, name, url); else await api.websites.add(name, url); setEditing(null); setName(''); setUrl(''); }); }}>
          <label>Website name<input required maxLength={200} value={name} onChange={e => setName(e.target.value)} /></label><label>Launch URL<input required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/" /></label>
          <button className="btn-primary" disabled={!!busy}>{editing ? 'Save changes' : 'Add a new website'}</button>{editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setName(''); setUrl(''); }}>Cancel</button>}
        </form>
        <div className="catalog-rows">{websites.map((w, i) => <article className="catalog-row" key={w.id}><div className="catalog-row-main"><span className="row-number">{String(i + 1).padStart(2, '0')}</span>{w.iconCachePath ? <img className="avatar" src={w.iconCachePath} alt="" /> : <span className="avatar letter-icon">{w.displayName[0].toUpperCase()}</span>}<div className="site-description"><strong>{w.displayName}</strong><span>{w.launchUrl}</span></div>
          <button className="btn-secondary" disabled={!!busy || i === 0} aria-label={`Move ${w.displayName} up in catalog`} onClick={() => void moveCatalog(i, -1)}>↑</button><button className="btn-secondary" disabled={!!busy || i === websites.length - 1} aria-label={`Move ${w.displayName} down in catalog`} onClick={() => void moveCatalog(i, 1)}>↓</button>
          <button className="btn-secondary" onClick={() => { setEditing(w.id); setName(w.displayName); setUrl(w.launchUrl); }}>Edit</button><button className="btn-secondary" disabled={!!busy} onClick={() => void upload(w.id)}>Upload PNG</button><button className="btn-secondary danger" disabled={!!busy} onClick={() => void run('Removing catalog entry…', async () => { await api.websites.remove(w.id); dispatch({ type: 'REMOVE_WEBSITE', websiteId: w.id }); })}>Remove</button></div>
          {iconFailures[w.id] && <p className="icon-error">{iconFailures[w.id]} You can keep using the placeholder. <button className="btn-secondary" onClick={() => void run('Fetching icon…', async () => { const r = await api.websites.fetchIcon(w.id); if (!r.ok) throw Error(ICON_ERROR); setIconFailures(prev => { const next = { ...prev }; delete next[w.id]; return next; }); })}>Retry icon</button></p>}
        </article>)}</div>
      </div>}
      {mode === 'diagnostics' && <div className="scroll-area diagnostics"><h2>Browser & extension setup</h2><p>{status.setup}</p><p>Eight required extensions are loaded with each profile. Missing or incompatible packages mean degraded use. Loading an extension does not sign in to its service or enable a VPN.</p><p>Exact tab ordering unpins tabs in the primary window. Browser presence does not prove any website is logged in.</p>
        <button className="btn-primary" disabled={!current || !!busy} onClick={() => current && void run('Inspecting extensions…', async () => setExtensions(await api.extensions(current.id)))}>Inspect selected account extensions</button>
        {extensions.map(e => <article className="extension-row" key={e.key}><strong>{e.key}</strong><span>Version {e.version || 'missing'} · {e.compatibilityStatus}</span><small>{e.runtime.length ? 'Browser reports matching version loaded; website behavior still needs manual verification.' : 'Not observed in the connected browser.'}</small><code>{e.digest ? `SHA-256 ${e.digest}` : 'No package digest'}</code></article>)}
        <p>Identity detection uses Steam’s authenticated own-profile link. If it fails, open your own profile using Steam’s account menu and retry. A different Steam identity never silently changes the account record.</p>
      </div>}
    </main>
  </>;
}
