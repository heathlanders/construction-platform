'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Button, Input, Select, Textarea, StatusPill, KpiTile,
  Card, Table, THead, TBody, TR, TH, TD, SlideOver, EmptyState, SkeletonRows,
  useToast, useConfirm,
} from '@/components/ui';

interface Project { id: string; name: string }
interface PunchListItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  version: number;
  created_at: string;
}
interface User { id: string; first_name: string; last_name: string; email: string }

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PunchSlideOver({
  item, users, onClose, onSaved, onDeleted,
}: {
  item: PunchListItem; users: User[];
  onClose: () => void; onSaved: (i: PunchListItem) => void; onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation('field');
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({
    title: item.title,
    description: item.description ?? '',
    status: item.status,
    assigned_to: item.assigned_to ?? '',
    due_date: item.due_date ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/punch-list-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, description: form.description || null,
          status: form.status, assigned_to: form.assigned_to || null,
          due_date: form.due_date || null, version: item.version,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { toast.error(t('punch_list.conflict', { defaultValue: 'Updated by someone else — reload to get the latest.' })); return; }
      if (!res.ok) { toast.error(data?.error?.message ?? t('punch_list.save_failed', { defaultValue: 'Save failed' })); return; }
      toast.success(t('punch_list.saved', { defaultValue: 'Saved' }));
      onSaved(data.punch_list_item);
    } catch { toast.error(t('punch_list.network_error', { defaultValue: 'Network error' })); } finally { setSaving(false); }
  };

  const del = async () => {
    const ok = await confirm({
      title: t('punch_list.delete_title', { defaultValue: 'Delete punch list item?' }),
      message: t('punch_list.delete_message', { defaultValue: 'This cannot be undone.' }),
      tone: 'danger',
      confirmLabel: t('punch_list.delete', { defaultValue: 'Delete' }),
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await fetch(`/api/punch-list-items/${item.id}`, { method: 'DELETE' });
      toast.success(t('punch_list.deleted', { defaultValue: 'Deleted' }));
      onDeleted(item.id);
    } finally { setDeleting(false); }
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      title={t('punch_list.item_title', { defaultValue: 'Punch List Item' })}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="sm" onClick={del} disabled={deleting} className="text-status-danger hover:bg-status-danger-bg">
            {deleting ? '…' : t('punch_list.delete', { defaultValue: 'Delete' })}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button size="sm" onClick={save} loading={saving} disabled={!form.title.trim()}>{t('common.save', { defaultValue: 'Save' })}</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label={t('punch_list.title_field', { defaultValue: 'Title' })} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <Textarea label={t('punch_list.description', { defaultValue: 'Description' })} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('punch_list.status', { defaultValue: 'Status' })} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="open">{t('punch_list.item_status.open')}</option>
            <option value="in_progress">{t('punch_list.item_status.in_progress')}</option>
            <option value="complete">{t('punch_list.item_status.complete')}</option>
          </Select>
          <Input type="date" label={t('punch_list.due_date', { defaultValue: 'Due Date' })} value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
        </div>
        <Select label={t('punch_list.assigned_to', { defaultValue: 'Assigned To' })} value={form.assigned_to} onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}>
          <option value="">{t('punch_list.unassigned', { defaultValue: '— Unassigned —' })}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
        </Select>
        <p className="border-t border-line pt-2 text-xs text-muted">{t('punch_list.created', { defaultValue: 'Created' })} {formatDate(item.created_at)}</p>
      </div>
    </SlideOver>
  );
}

export default function PunchListPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('field');

  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<PunchListItem[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<PunchListItem | null>(null);

  const load = useCallback(() => {
    void Promise.allSettled([
      fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (d.project) setProject(d.project as Project); }),
      fetch(`/api/punch-list-items?project_id=${id}&limit=50`).then((r) => r.json()).then((d) => setItems(d.punch_list_items ?? [])),
      fetch(`/api/people?limit=100`).then((r) => r.json()).then((d) => { if (d.users) setUsers(d.users as User[]); }),
    ]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const list = items ?? [];
  const openCount = list.filter((i) => i.status === 'open').length;
  const inProgressCount = list.filter((i) => i.status === 'in_progress').length;
  const completeCount = list.filter((i) => i.status === 'complete').length;
  const userMap = Object.fromEntries(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`]));

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-muted">
          <Link href="/projects" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${id}`} className="hover:text-ink">{project?.name ?? '…'}</Link>
          <span>/</span>
          <span className="text-ink">{t('punch_list.title')}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('punch_list.title')}</h1>
          <Link href={`/projects/${id}/punch-list/new`}><Button>+ {t('punch_list.new')}</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiTile label={t('punch_list.item_status.open')} value={openCount} />
        <KpiTile label={t('punch_list.item_status.in_progress')} value={inProgressCount} />
        <KpiTile label={t('punch_list.item_status.complete')} value={completeCount} />
      </div>

      {items === null ? (
        <SkeletonRows rows={5} />
      ) : items.length === 0 ? (
        <EmptyState title={t('punch_list.no_items')} />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>{t('punch_list.title_field')}</TH>
                <TH>{t('punch_list.status')}</TH>
                <TH>{t('punch_list.assigned_to')}</TH>
                <TH>{t('punch_list.due_date')}</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id} onClick={() => setSelected(item)} className="cursor-pointer">
                  <TD className="font-medium">{item.title}</TD>
                  <TD><StatusPill status={item.status} /></TD>
                  <TD className="text-muted">{item.assigned_to ? (userMap[item.assigned_to] ?? item.assigned_to.slice(0, 8) + '…') : '—'}</TD>
                  <TD className="text-muted">{item.due_date ? formatDate(item.due_date) : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {selected && (
        <PunchSlideOver
          item={selected} users={users}
          onClose={() => setSelected(null)}
          onSaved={(updated) => { setItems((prev) => (prev ?? []).map((i) => (i.id === updated.id ? updated : i))); setSelected(null); }}
          onDeleted={(deletedId) => { setItems((prev) => (prev ?? []).filter((i) => i.id !== deletedId)); setSelected(null); }}
        />
      )}
    </div>
  );
}
