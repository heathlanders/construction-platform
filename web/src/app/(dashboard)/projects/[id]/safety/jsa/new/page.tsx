'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { SuggestHazards, type SuggestedHazard } from '@/components/safety/suggest-hazards';
import { Button, Input, Select, Card, PageHeader } from '@/components/ui';

interface User { id: string; first_name: string; last_name: string; email: string }

type Hazard = SuggestedHazard;

interface Attendee {
  user_id: string;
  name: string;
  signature_at: string | null;
}

export default function NewJsaPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { t } = useTranslation('safety');

  const [title, setTitle] = useState('');
  const [conductedAt, setConductedAt] = useState(new Date().toISOString().slice(0, 16));
  const [hazards, setHazards] = useState<Hazard[]>([{ description: '', controls: '', severity: 'medium' }]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users?limit=100')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
  }, []);

  function addHazard() {
    setHazards((prev) => [...prev, { description: '', controls: '', severity: 'medium' }]);
  }

  function addSuggested(h: SuggestedHazard) {
    setHazards((prev) => {
      // Fill the blank starter row first so the list doesn't keep an empty card.
      const blank = prev.findIndex((x) => !x.description.trim());
      return blank >= 0 ? prev.map((x, i) => (i === blank ? h : x)) : [...prev, h];
    });
  }

  function removeHazard(idx: number) {
    setHazards((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateHazard(idx: number, field: 'description' | 'controls' | 'severity', value: string) {
    setHazards((prev) => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  }

  function toggleAttendee(user: User) {
    setAttendees((prev) => {
      const exists = prev.find((a) => a.user_id === user.id);
      if (exists) return prev.filter((a) => a.user_id !== user.id);
      return [...prev, { user_id: user.id, name: `${user.first_name} ${user.last_name}`, signature_at: null }];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError(t('jsa.title_required')); return; }
    const validHazards = hazards.filter((h) => h.description.trim());
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/jsa-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: title.trim(),
          conducted_at: new Date(conductedAt).toISOString(),
          hazards: validHazards,
          attendees,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error?.message ?? t('jsa.failed_to_create'));
        return;
      }
      router.push(`/projects/${projectId}/safety/jsa`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href={`/projects/${projectId}/safety`} className="hover:text-ink">{t('safety.title')}</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}/safety/jsa`} className="hover:text-ink">{t('jsa.back_to_jsa')}</Link>
        <span>/</span>
        <span className="text-ink">New</span>
      </div>

      <PageHeader className="mb-6" title={t('jsa.form_title')} />

      {error && (
        <div className="mb-4 rounded-md border border-status-danger/40 bg-status-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg" className="space-y-4">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('jsa.details_section')}</h2>

          <Input
            label={t('jsa.title_label')}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('jsa.title_placeholder')}
            required
          />

          <Input
            label={t('jsa.conducted_at_label')}
            type="datetime-local"
            value={conductedAt}
            onChange={(e) => setConductedAt(e.target.value)}
            required
          />
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">{t('jsa.hazards')}</h2>
            <button type="button" onClick={addHazard} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              + {t('jsa.add_hazard')}
            </button>
          </div>
          <div className="mb-4">
            <SuggestHazards
              projectId={projectId}
              day={conductedAt.slice(0, 10)}
              existing={hazards.map((h) => h.hazard_id).filter((x): x is string => !!x)}
              onAdd={addSuggested}
            />
          </div>
          <div className="space-y-4">
            {hazards.map((h, idx) => (
              <div key={idx} className="rounded-md border border-line p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      label={t('jsa.hazard_description')}
                      type="text"
                      value={h.description}
                      onChange={(e) => updateHazard(idx, 'description', e.target.value)}
                      placeholder={t('jsa.hazard_description_placeholder')}
                    />
                  </div>
                  <button type="button" onClick={() => removeHazard(idx)} className="mt-7 text-xs text-status-danger hover:text-status-danger-hover">
                    {t('jsa.remove_hazard')}
                  </button>
                </div>
                <Input
                  label={t('jsa.controls')}
                  type="text"
                  value={h.controls}
                  onChange={(e) => updateHazard(idx, 'controls', e.target.value)}
                  placeholder={t('jsa.controls_placeholder')}
                />
                <Select
                  label={t('jsa.hazard_severity')}
                  value={h.severity}
                  onChange={(e) => updateHazard(idx, 'severity', e.target.value)}
                >
                  <option value="low">{t('jsa.severity_low')}</option>
                  <option value="medium">{t('jsa.severity_medium')}</option>
                  <option value="high">{t('jsa.severity_high')}</option>
                  <option value="critical">{t('jsa.severity_critical')}</option>
                </Select>
                {h.source === 'pack' && h.osha_ref && (
                  <p className="text-xs text-muted">OSHA {h.osha_ref} · {t('jsa.from_trade_pack')}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {users.length > 0 && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide mb-3">{t('jsa.attendees')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => {
                const selected = attendees.some((a) => a.user_id === u.id);
                return (
                  <label key={u.id} className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${selected ? 'border-brand-500 bg-brand-50' : 'border-line hover:bg-surface-alt'}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAttendee(u)}
                      className="rounded text-brand-600"
                    />
                    <span className="text-ink">{u.first_name} {u.last_name}</span>
                  </label>
                );
              })}
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>
            {saving ? t('jsa.saving') : t('jsa.create_jsa')}
          </Button>
          <Link href={`/projects/${projectId}/safety/jsa`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
