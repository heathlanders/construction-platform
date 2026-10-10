'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, CardHeader, KpiTile, Badge, Table, THead, TBody, TR, TH, TD, EmptyState, SkeletonRows } from '@/components/ui';
import { BarChart } from '@/components/charts';

interface ProjectPL {
  id: string;
  name: string;
  status: string;
  contract_total_cents: number;
  billed_cents: number;
  actual_cents: number;
  projected_final_cents: number;
  budget_cents: number;
  variance_cents: number;
  margin_pct: number | null;
}

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

function marginColor(pct: number | null) {
  if (pct === null) return 'text-muted';
  if (pct >= 15) return 'text-status-success font-semibold';
  if (pct >= 5) return 'text-status-success';
  if (pct >= 0) return 'text-status-warning';
  return 'text-status-danger font-semibold';
}

function varianceColor(cents: number) {
  return cents >= 0 ? 'text-status-success' : 'text-status-danger';
}

function shortName(name: string) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

export default function ProfitabilityPage() {
  const [projects, setProjects] = useState<ProjectPL[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reports/profitability')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error.message ?? 'Failed to load'); setProjects([]); }
        else setProjects(d.projects ?? []);
      })
      .catch(() => { setError('Failed to load report'); setProjects([]); });
  }, []);

  const list = projects ?? [];
  const totals = list.reduce(
    (acc, p) => ({
      contract: acc.contract + p.contract_total_cents,
      billed: acc.billed + p.billed_cents,
      cost: acc.cost + p.actual_cents,
      projected: acc.projected + p.projected_final_cents,
    }),
    { contract: 0, billed: 0, cost: 0, projected: 0 },
  );

  const chartData = [...list]
    .sort((a, b) => b.contract_total_cents - a.contract_total_cents)
    .slice(0, 6)
    .map((p) => ({ label: shortName(p.name), value: Math.round(p.contract_total_cents / 100) }));

  return (
    <div className="space-y-6">
      <PageHeader title="Profitability Report" subtitle="Cross-project P&L — Owner and Accountant access only" />

      {error && (
        <Card className="border-status-danger/40 bg-status-danger-bg">
          <p className="text-sm text-status-danger">{error}</p>
        </Card>
      )}

      {projects === null ? (
        <SkeletonRows rows={6} />
      ) : list.length === 0 && !error ? (
        <EmptyState title="No projects found." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiTile label="Total Contract Value" value={fmt(totals.contract)} />
            <KpiTile label="Total Billed" value={fmt(totals.billed)} />
            <KpiTile label="Total Cost to Date" value={fmt(totals.cost)} />
            <KpiTile label="Total Projected Final" value={fmt(totals.projected)} />
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader title="Contract value by project" subtitle="Top projects ($)" />
              <div className="mt-3"><BarChart data={chartData} ariaLabel="Contract value by project" /></div>
            </Card>
          )}

          <Card padding="none" className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Project</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Contract Value</TH>
                  <TH className="text-right">Billed</TH>
                  <TH className="text-right">Cost to Date</TH>
                  <TH className="text-right">Projected Final</TH>
                  <TH className="text-right">Margin</TH>
                  <TH className="text-right">Variance</TH>
                </TR>
              </THead>
              <TBody>
                {list.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/projects/${p.id}/budget`} className="font-medium text-brand-600 hover:text-brand-700">{p.name}</Link>
                    </TD>
                    <TD><Badge status={p.status} /></TD>
                    <TD className="text-right tabular-nums text-muted">{fmt(p.contract_total_cents)}</TD>
                    <TD className="text-right tabular-nums text-muted">{fmt(p.billed_cents)}</TD>
                    <TD className="text-right tabular-nums text-muted">{fmt(p.actual_cents)}</TD>
                    <TD className="text-right tabular-nums text-muted">{fmt(p.projected_final_cents)}</TD>
                    <TD className={`text-right tabular-nums ${marginColor(p.margin_pct)}`}>{p.margin_pct !== null ? `${p.margin_pct}%` : '—'}</TD>
                    <TD className={`text-right tabular-nums ${varianceColor(p.variance_cents)}`}>{p.variance_cents >= 0 ? `+${fmt(p.variance_cents)}` : fmt(p.variance_cents)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
