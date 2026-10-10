'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Input,
  Select,
  Textarea,
  Badge,
  Card,
  PageHeader,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
} from '@/components/ui';

interface HvacEquipment {
  id: string;
  equipment_type: string;
  manufacturer: string | null;
  model: string | null;
  tonnage: number | null;
  seer_rating: number | null;
  location: string | null;
  install_date: string | null;
  status: string;
  permit_number: string | null;
  notes: string | null;
  version: number;
}

const EQUIPMENT_TYPES = ['furnace','ac_unit','heat_pump','air_handler','mini_split','duct_system','ventilation','other'];
const STATUSES = ['planned','ordered','installed','commissioned','complete'];

export default function HvacPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [equipment, setEquipment] = useState<HvacEquipment[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/hvac-equipment?project_id=${projectId}`)
      .then((r) => r.json())
      .then((d) => setEquipment(d.hvac_equipment ?? []))
      .catch(() => setError('Failed to load HVAC equipment'));
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { project_id: projectId };
    ['equipment_type','manufacturer','model','location','permit_number','install_date','status','notes'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = v;
    });
    ['tonnage','seer_rating'].forEach((k) => {
      const v = fd.get(k) as string;
      if (v) body[k] = parseFloat(v);
    });
    const res = await fetch('/api/hvac-equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setEquipment((prev) => [data.hvac_equipment, ...prev]);
      setShowForm(false);
    } else {
      setError('Failed to create HVAC equipment');
    }
  };

  return (
    <div>
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href={`/projects/${projectId}`} className="hover:text-ink">Project</Link>
          <span>›</span>
          <span>HVAC</span>
        </div>
        <PageHeader
          title="HVAC Equipment"
          actions={<Button size="sm" onClick={() => setShowForm(!showForm)}>+ Add Equipment</Button>}
        />
      </div>

      {error && (
        <div className="rounded-md border border-status-danger/40 bg-status-danger-bg p-3 mb-4 text-sm text-status-danger">{error}</div>
      )}

      {showForm && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-sm font-semibold text-ink mb-4">New HVAC Equipment</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Equipment Type *" name="equipment_type" required>
                {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </Select>
              <Select label="Status" name="status">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </Select>
              <Input label="Manufacturer" type="text" name="manufacturer" placeholder="e.g. Carrier, Trane, Lennox" />
              <Input label="Model" type="text" name="model" />
              <Input label="Tonnage" type="number" name="tonnage" step="0.5" min="0" placeholder="e.g. 3.5" />
              <Input label="SEER Rating" type="number" name="seer_rating" step="0.1" min="0" placeholder="e.g. 16.0" />
              <Input label="Location" type="text" name="location" placeholder="e.g. Basement, Attic, Unit 2" />
              <Input label="Permit Number" type="text" name="permit_number" />
              <Input label="Install Date" type="date" name="install_date" />
              <div className="col-span-2">
                <Textarea label="Notes" name="notes" rows={2} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" loading={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {equipment.length === 0 && !showForm ? (
        <EmptyState
          title="No HVAC equipment recorded"
          description="Add equipment to get started."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Type</TH>
                <TH>Manufacturer / Model</TH>
                <TH className="text-right">Tonnage</TH>
                <TH className="text-right">SEER</TH>
                <TH>Location</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {equipment.map((eq) => (
                <TR key={eq.id}>
                  <TD className="capitalize font-medium">{eq.equipment_type.replace(/_/g, ' ')}</TD>
                  <TD>{[eq.manufacturer, eq.model].filter(Boolean).join(' ') || '—'}</TD>
                  <TD className="text-right text-muted">{eq.tonnage != null ? `${eq.tonnage} ton` : '—'}</TD>
                  <TD className="text-right text-muted">{eq.seer_rating ?? '—'}</TD>
                  <TD className="text-muted">{eq.location ?? '—'}</TD>
                  <TD>
                    <Badge status={eq.status} className="capitalize">{eq.status.replace(/_/g, ' ')}</Badge>
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
