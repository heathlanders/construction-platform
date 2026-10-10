'use client';

// Internal component-kit preview (dev aid). Renders every primitive so the kit
// can be eyeballed in light + dark via the top-nav theme toggle. Not linked in nav.

import { useState } from 'react';
import {
  Button, Input, Select, Textarea, Badge, StatusDot, StatusPill,
  Card, CardHeader, PageHeader, Table, THead, TBody, TR, TH, TD,
  Modal, SlideOver, EmptyState, Skeleton, Spinner, ProgressBar, KpiTile,
  Pagination, Tabs, useToast, useConfirm,
} from '@/components/ui';
import { AreaChart, BarChart, Sparkline, Donut } from '@/components/charts';

const STATES = ['active', 'on_hold', 'overdue', 'open', 'pending', 'draft', 'requires_action', 'completed'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="mt-4 flex flex-wrap items-start gap-4">{children}</div>
    </Card>
  );
}

export default function DesignPreviewPage() {
  const [modal, setModal] = useState(false);
  const [slide, setSlide] = useState(false);
  const [tab, setTab] = useState('one');
  const toast = useToast();
  const confirm = useConfirm();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Component kit"
        subtitle="Internal preview — toggle the theme in the top bar to check dark mode."
        actions={<Button onClick={() => toast.success('Looks good')}>Fire a toast</Button>}
      />

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button loading>Loading</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </Section>

      <Section title="Status — badges, pills, dots">
        {STATES.map((s) => <Badge key={s} status={s} />)}
        <div className="flex flex-wrap gap-2">{STATES.map((s) => <StatusPill key={s} status={s} />)}</div>
        <div className="flex flex-wrap gap-2">{STATES.map((s) => <StatusPill key={s} status={s} solid />)}</div>
        <div className="flex items-center gap-3">{STATES.map((s) => <StatusDot key={s} status={s} />)}</div>
      </Section>

      <Section title="Form controls">
        <div className="w-56"><Input label="Project name" placeholder="Maple St" /></div>
        <div className="w-56"><Input label="With error" error="Required" defaultValue="" /></div>
        <div className="w-56"><Select label="Status"><option>Active</option><option>On hold</option></Select></div>
        <div className="w-72"><Textarea label="Notes" placeholder="Add a note…" rows={2} /></div>
      </Section>

      <Section title="KPI tiles + charts">
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiTile label="Active projects" value="8" delta="+2" deltaTone="up" />
          <KpiTile label="Open RFIs" value="5" delta="2 due" deltaTone="flat" hint="this week" />
          <KpiTile label="Overdue" value="1" delta="+1" deltaTone="down" />
          <KpiTile label="Budget var." value="+2.4%" delta="under" deltaTone="up" />
        </div>
        <Card className="w-full"><CardHeader title="Budget consumed" /><div className="mt-3"><AreaChart data={[62, 68, 74, 71, 83, 90]} labels={['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']} /></div></Card>
        <Card className="w-full sm:w-1/2"><CardHeader title="By trade" /><div className="mt-3"><BarChart data={[{ label: 'Elec', value: 12 }, { label: 'Plmb', value: 8 }, { label: 'HVAC', value: 5 }, { label: 'Frame', value: 15 }]} /></div></Card>
        <div className="flex items-center gap-6"><Donut value={63} total={100} label="Complete" /><Sparkline data={[3, 5, 4, 7, 6, 9, 8]} /></div>
      </Section>

      <Section title="Table">
        <Table>
          <THead><TR><TH>Project</TH><TH>Status</TH><TH>Budget</TH><TH>Progress</TH></TR></THead>
          <TBody>
            {[['Lot 25 — Maple St', 'active', '$1.24M', 78], ['Oak Ridge Barn', 'on_hold', '$0.84M', 41], ['Cedar Flats', 'overdue', '$3.10M', 52]].map((r) => (
              <TR key={r[0] as string}>
                <TD className="font-medium">{r[0]}</TD>
                <TD><StatusPill status={r[1] as string} /></TD>
                <TD className="tabular-nums">{r[2]}</TD>
                <TD><div className="flex items-center gap-2"><ProgressBar value={r[3] as number} className="w-28" /><span className="text-xs text-muted">{r[3]}%</span></div></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Section>

      <Section title="Overlays, feedback, tabs, states">
        <Button onClick={() => setModal(true)}>Open modal</Button>
        <Button variant="secondary" onClick={() => setSlide(true)}>Open slide-over</Button>
        <Button variant="secondary" onClick={() => toast.info('Saved')}>Toast</Button>
        <Button variant="danger" onClick={async () => { if (await confirm({ title: 'Delete item?', message: 'This cannot be undone.', tone: 'danger', confirmLabel: 'Delete' })) toast.error('Deleted'); }}>Confirm…</Button>
        <div className="w-full"><Tabs items={[{ key: 'one', label: 'Overview' }, { key: 'two', label: 'Details' }, { key: 'three', label: 'History' }]} value={tab} onChange={setTab} /></div>
        <div className="flex items-center gap-3"><Spinner /><Skeleton className="h-8 w-40" /></div>
        <div className="w-full"><EmptyState title="No projects yet" description="Create your first project to get started." action={<Button size="sm">+ New project</Button>} /></div>
        <div className="w-full"><Pagination hasPrev={false} hasNext label="Showing 1–20" /></div>
      </Section>

      <Modal open={modal} onClose={() => setModal(false)} title="Example modal" footer={<><Button variant="secondary" size="sm" onClick={() => setModal(false)}>Cancel</Button><Button size="sm" onClick={() => setModal(false)}>Save</Button></>}>
        <p className="text-sm text-muted">A centered dialog with focus trap, Escape to close, and scrim dismiss.</p>
      </Modal>
      <SlideOver open={slide} onClose={() => setSlide(false)} title="Example slide-over" footer={<Button size="sm" onClick={() => setSlide(false)}>Done</Button>}>
        <div className="flex flex-col gap-3">
          <Input label="Title" defaultValue="Punch item" />
          <Textarea label="Notes" rows={3} />
        </div>
      </SlideOver>
    </div>
  );
}
