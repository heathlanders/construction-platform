'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PageHeader, Button, Card, Input, Select, Textarea, Tabs, StatusPill, EmptyState, SkeletonRows } from '@/components/ui';
import { useTradeTaxonomy, tradeDisplayLabel, groupByCategory } from '@/components/trades/use-trade-taxonomy';

interface DiscoveryResult {
  tenant_id: string;
  name: string;
  trades: string[];
  states: string[];
  service_area: string | null;
}

interface Connection {
  id: string;
  gc_tenant_id: string;
  sub_tenant_id: string;
  gc_tenant_name?: string;
  sub_tenant_name?: string;
  status: 'pending' | 'active' | 'revoked' | 'rejected' | 'completed';
  scope_description?: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectOption { id: string; name: string }

export default function ConnectionsPage() {
  const { t, i18n } = useTranslation('connections');

  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [tab, setTab] = useState<'pending' | 'active' | 'completed' | 'revoked' | 'rejected'>('active');
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [addonBlocked, setAddonBlocked] = useState(false);

  // Lookup flow: slug/email exact lookup OR fuzzy directory search → resolved company → confirm invite
  const [lookupMode, setLookupMode] = useState<'slug' | 'email' | 'search'>('slug');
  const [lookupValue, setLookupValue] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [found, setFound] = useState<{ tenant_id: string; name: string } | null>(null);

  // Discovery search filters + results (Doc 07 §3.3 — opt-in directory)
  const taxonomy = useTradeTaxonomy();
  const [searchTrade, setSearchTrade] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchResults, setSearchResults] = useState<DiscoveryResult[] | null>(null);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState('');
  const [scope, setScope] = useState('');
  const [contractValue, setContractValue] = useState(''); // dollars string → cents

  const load = async () => {
    const res = await fetch('/api/connections?limit=100');
    const data = await res.json() as { connections?: Connection[] };
    setConnections(data.connections ?? []);
  };

  useEffect(() => {
    void load().catch(() => setConnections([]));
    void fetch('/api/projects?limit=100')
      .then((r) => r.json())
      .then((d: { projects?: ProjectOption[] }) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]));
  }, []);

  const handleLookup = async () => {
    if (!lookupValue.trim() || lookingUp) return;
    setLookingUp(true);
    setLookupError('');
    setFound(null);
    const qs = `${lookupMode}=${encodeURIComponent(lookupValue.trim())}`;
    const res = await fetch(`/api/connections/lookup?${qs}`);
    const data = await res.json() as { tenant?: { tenant_id: string; name: string }; error?: { code: string } };
    if (res.ok && data.tenant) {
      setFound(data.tenant);
    } else if (res.status === 402) {
      setAddonBlocked(true);
      setShowInvite(false);
    } else if (data.error?.code === 'EMAIL_AMBIGUOUS') {
      setLookupError(t('invite.lookup_ambiguous'));
    } else {
      setLookupError(t('invite.lookup_not_found'));
    }
    setLookingUp(false);
  };

  const handleDiscoverySearch = async () => {
    const q = lookupValue.trim();
    if (q.length < 2 || lookingUp) return;
    setLookingUp(true);
    setLookupError('');
    setFound(null);
    setSearchResults(null);
    const params = new URLSearchParams({ q });
    if (searchTrade) params.set('trade', searchTrade);
    if (searchState.trim()) params.set('state', searchState.trim().toUpperCase());
    const res = await fetch(`/api/connections/discovery?${params.toString()}`);
    const data = await res.json() as { results?: DiscoveryResult[]; error?: { code: string } };
    if (res.ok) {
      setSearchResults(data.results ?? []);
    } else if (res.status === 402) {
      setAddonBlocked(true);
      setShowInvite(false);
    } else {
      setLookupError(t('discovery.search_error'));
    }
    setLookingUp(false);
  };

  const tradeLabelFor = (key: string): string => {
    const def = taxonomy.find((tr) => tr.key === key);
    return def ? tradeDisplayLabel(def, i18n.language) : key;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!found || inviting) return;
    setInviting(true);
    setInviteError('');
    setInviteSuccess(false);

    const cents = contractValue.trim() ? Math.round(Number(contractValue) * 100) : undefined;
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sub_tenant_id: found.tenant_id,
        ...(projectId ? { project_id: projectId } : {}),
        ...(scope.trim() ? { scope_description: scope.trim() } : {}),
        ...(cents !== undefined && Number.isFinite(cents) ? { contract_value_cents: cents } : {}),
      }),
    });
    const data = await res.json() as { error?: { code: string } };

    if (res.ok) {
      setInviteSuccess(true);
      setShowInvite(false);
      setFound(null);
      setLookupValue('');
      setProjectId('');
      setScope('');
      setContractValue('');
      await load();
    } else if (res.status === 402) {
      setAddonBlocked(true);
      setShowInvite(false);
    } else {
      if (data.error?.code === 'CONNECTION_EXISTS') setInviteError(t('invite.error_exists'));
      else if (data.error?.code === 'NOT_FOUND') setInviteError(t('invite.error_not_found'));
      else setInviteError(t('invite.error_generic'));
    }
    setInviting(false);
  };

  const list = connections ?? [];
  const filtered = list.filter((c) => c.status === tab);
  const emptyKey: Record<string, string> = {
    pending: t('list.no_pending'),
    active: t('list.no_active'),
    completed: t('list.no_completed'),
    revoked: t('list.no_revoked'),
    rejected: t('list.no_rejected'),
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={t('list.title')}
        subtitle={t('list.subtitle')}
        actions={<Button onClick={() => { setShowInvite(!showInvite); setInviteError(''); setInviteSuccess(false); }}>+ {t('list.invite_btn')}</Button>}
      />

      {addonBlocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t('invite.upgrade_title')}</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t('invite.upgrade_body')}</p>
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            {t('invite.upgrade_cta')}
          </Link>
        </div>
      )}

      {inviteSuccess && (
        <div className="rounded-md border border-status-success/40 bg-status-success-bg px-4 py-3 text-sm text-status-success">
          {t('invite.success')}
        </div>
      )}

      {showInvite && (
        <Card padding="lg">
          <form onSubmit={handleInvite} className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">{t('invite.title')}</h2>

            <div className="flex gap-2">
              {(['slug', 'email', 'search'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setLookupMode(m); setFound(null); setLookupError(''); setSearchResults(null); }}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    lookupMode === m ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:bg-surface-alt'
                  }`}
                >
                  {m === 'search' ? t('discovery.mode_search') : t(`invite.lookup_mode_${m}`)}
                </button>
              ))}
            </div>

            {lookupMode !== 'search' ? (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label={t('invite.lookup_label')}
                    placeholder={t(`invite.lookup_placeholder_${lookupMode}`)}
                    value={lookupValue}
                    onChange={(e) => { setLookupValue(e.target.value); setFound(null); }}
                  />
                </div>
                <Button type="button" variant="secondary" loading={lookingUp} onClick={handleLookup} disabled={!lookupValue.trim()}>
                  {t('invite.lookup_btn')}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-48 flex-1">
                    <Input
                      label={t('discovery.search_label')}
                      placeholder={t('discovery.search_placeholder')}
                      value={lookupValue}
                      onChange={(e) => { setLookupValue(e.target.value); setFound(null); }}
                    />
                  </div>
                  <div className="w-52">
                    <Select label={t('discovery.trade_filter')} value={searchTrade} onChange={(e) => setSearchTrade(e.target.value)}>
                      <option value="">{t('discovery.any_trade')}</option>
                      {groupByCategory(taxonomy).map(({ category, trades: group }) => (
                        <optgroup key={category} label={category.replace(/_/g, ' ')}>
                          {group.map((tr) => (
                            <option key={tr.key} value={tr.key}>{tradeDisplayLabel(tr, i18n.language)}</option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      label={t('discovery.state_filter')}
                      placeholder="WI"
                      maxLength={2}
                      value={searchState}
                      onChange={(e) => setSearchState(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="secondary" loading={lookingUp} onClick={handleDiscoverySearch} disabled={lookupValue.trim().length < 2}>
                    {t('discovery.search_btn')}
                  </Button>
                </div>

                {searchResults !== null && searchResults.length === 0 && (
                  <p className="text-sm text-muted">{t('discovery.no_results')}</p>
                )}
                {searchResults !== null && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((r) => (
                      <button
                        key={r.tenant_id}
                        type="button"
                        onClick={() => { setFound({ tenant_id: r.tenant_id, name: r.name }); setSearchResults(null); }}
                        className="block w-full rounded-lg border border-line p-3 text-left transition-colors hover:border-brand hover:bg-brand/5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{r.name}</span>
                          <span className="rounded-full border border-status-success/40 bg-status-success-bg px-2 py-0.5 text-[11px] text-status-success">
                            {t('discovery.verified_badge')}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {r.trades.map((k) => (
                            <span key={k} className="rounded-full bg-surface-alt border border-line px-2 py-0.5 text-[11px] text-muted">{tradeLabelFor(k)}</span>
                          ))}
                          {r.states.length > 0 && <span className="text-[11px] text-muted">· {r.states.join(', ')}</span>}
                          {r.service_area && <span className="truncate text-[11px] text-muted">· {r.service_area}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {lookupError && <p className="text-sm text-status-danger">{lookupError}</p>}

            {found && (
              <>
                <div className="rounded-md border border-status-success/40 bg-status-success-bg px-4 py-3 text-sm text-status-success">
                  {t('invite.lookup_found', { name: found.name })}
                </div>

                <Select label={t('invite.project_label')} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">{t('invite.project_none')}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>

                <Textarea
                  label={t('invite.scope_label')}
                  placeholder={t('invite.scope_placeholder')}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  rows={2}
                  maxLength={2000}
                />

                <div className="max-w-xs">
                  <Input
                    label={t('invite.contract_value_label')}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                  />
                </div>
              </>
            )}

            {inviteError && <p className="text-sm text-status-danger">{inviteError}</p>}
            <div className="flex gap-3">
              <Button type="submit" loading={inviting} disabled={!found}>{t('invite.submit')}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowInvite(false)}>{t('invite.cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      <Tabs
        value={tab}
        onChange={(k) => setTab(k as typeof tab)}
        items={(['active', 'pending', 'completed', 'revoked', 'rejected'] as const).map((s) => ({
          key: s,
          label: `${t(`list.${s}_tab`)} (${list.filter((c) => c.status === s).length})`,
        }))}
      />

      {connections === null ? (
        <SkeletonRows rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState title={emptyKey[tab]} />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-line">
            {filtered.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between px-4 py-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-sm text-ink">
                    <span className="truncate font-medium">{conn.gc_tenant_name ?? conn.gc_tenant_id}</span>
                    <span className="text-muted">↔</span>
                    <span className="truncate font-medium">{conn.sub_tenant_name ?? conn.sub_tenant_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={conn.status} label={t(`list.status_${conn.status}`)} />
                    {conn.scope_description && <span className="truncate text-xs text-muted">{conn.scope_description}</span>}
                    <span className="text-xs text-muted">{new Date(conn.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  href={`/connections/${conn.id}`}
                  className="ml-4 whitespace-nowrap rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface-alt"
                >
                  {t('list.view_btn')}
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
