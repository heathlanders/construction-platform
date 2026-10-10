'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Card, Button, Input, Table, THead, TBody, TR, TH, TD, StatusPill, EmptyState, Spinner } from '@/components/ui';

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface GeneratedKey {
  key: string;
  name: string;
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState('');

  // Shown once after generation
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null);
  const [copied, setCopied] = useState(false);

  const [revoking, setRevoking] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/settings/api-keys');
      if (res.status === 402) {
        setUpgradeRequired(true);
        return;
      }
      const data = await res.json() as { api_keys?: ApiKey[]; error?: { code: string } };
      if (data.error?.code === 'ENTERPRISE_REQUIRED') {
        setUpgradeRequired(true);
        return;
      }
      setKeys(data.api_keys ?? []);
    } catch {
      setError('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating || !newKeyName.trim()) return;
    setFormError('');
    setGenerating(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json() as { api_key?: ApiKey & { key?: string }; key?: string; error?: { code: string; message: string } };
      if (!res.ok) {
        if (res.status === 402 || data.error?.code === 'ENTERPRISE_REQUIRED') {
          setUpgradeRequired(true);
          setShowForm(false);
        } else {
          setFormError(data.error?.message ?? 'Failed to generate key.');
        }
        return;
      }
      const fullKey = data.api_key?.key ?? data.key ?? '';
      setGeneratedKey({ key: fullKey, name: newKeyName.trim() });
      setShowForm(false);
      setNewKeyName('');
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (revoking) return;
    setRevoking(keyId);
    setMessage('');
    try {
      const res = await fetch(`/api/settings/api-keys/${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('API key revoked.');
        await load();
      } else {
        setMessage('Failed to revoke key.');
      }
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    void navigator.clipboard.writeText(generatedKey.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-5 w-5" /> Loading…</div>
  );

  if (upgradeRequired) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="API Keys" className="mb-6" />
        <Card padding="lg" className="text-center py-8">
          <p className="text-sm font-semibold text-ink mb-2">Enterprise Plan Required</p>
          <p className="text-sm text-muted mb-4">API access is available on the Enterprise plan ($1,499+/mo).</p>
          <a
            href="mailto:sales@constructionplatform.com"
            className="inline-flex items-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
          >
            Contact Sales to Upgrade
          </a>
        </Card>
      </div>
    );
  }

  if (error) return <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-4 text-sm text-status-danger">{error}</div>;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="API Keys"
        className="mb-6"
        actions={
          <Button onClick={() => { setShowForm(!showForm); setFormError(''); setGeneratedKey(null); }}>
            + Generate New Key
          </Button>
        }
      />

      {message && (
        <div className="mb-4 rounded-md border border-status-info/40 bg-status-info-bg px-4 py-3 text-sm text-status-info">
          {message}
        </div>
      )}

      {/* Newly generated key — shown once */}
      {generatedKey && (
        <Card padding="none" className="mb-6 border-status-success/40 bg-status-success-bg p-4">
          <p className="text-sm font-semibold text-status-success mb-1">
            API Key generated for "{generatedKey.name}"
          </p>
          <p className="text-xs text-status-success mb-3">
            This key will not be shown again. Copy it now and store it securely.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 block rounded bg-surface border border-status-success/40 px-3 py-2 text-xs font-mono text-ink break-all">
              {generatedKey.key}
            </code>
            <Button variant="secondary" size="sm" onClick={handleCopy} className="whitespace-nowrap">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <button
            onClick={() => setGeneratedKey(null)}
            className="mt-3 text-xs text-status-success hover:opacity-80 underline"
          >
            Dismiss
          </button>
        </Card>
      )}

      {/* Generate form */}
      {showForm && (
        <Card padding="lg" className="mb-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">Generate New API Key</h2>
            <Input
              label="Key Name *"
              type="text"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Integration"
            />
            {formError && <p className="text-sm text-status-danger">{formError}</p>}
            <div className="flex gap-3">
              <Button type="submit" loading={generating} disabled={generating || !newKeyName.trim()}>
                {generating ? 'Generating…' : 'Generate Key'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {keys.length === 0 ? (
        <EmptyState title="No API keys yet." description="Generate one to get started." />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR className="bg-surface-alt">
                <TH>Name</TH>
                <TH>Created</TH>
                <TH>Last Used</TH>
                <TH>Status</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {keys.map((key) => (
                <TR key={key.id}>
                  <TD className="font-medium text-ink">{key.name}</TD>
                  <TD className="text-muted">{formatDate(key.created_at)}</TD>
                  <TD className="text-muted">{formatDate(key.last_used_at)}</TD>
                  <TD>
                    {key.revoked ? (
                      <StatusPill status="revoked" label="Revoked" />
                    ) : (
                      <StatusPill status="active" label="Active" />
                    )}
                  </TD>
                  <TD className="text-end">
                    {!key.revoked && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleRevoke(key.id)}
                        loading={revoking === key.id}
                        disabled={revoking === key.id}
                      >
                        Revoke
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
