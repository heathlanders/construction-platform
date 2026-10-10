'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TaskDetailPanel from '@/components/tasks/task-detail-panel';

interface OverviewTask {
  id: string;
  title: string;
  status: string;
  percent_complete: number;
  planned_start: string | null;
  planned_end: string | null;
  predecessor_task_id: string | null;
  version: number;
  phase: string | null;
  trade_type: string | null;
  csi_division: string | null;
  sort_order: number | null;
}

interface OverviewDep {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type: string;
  origin: string;
}

interface OverviewSummary {
  total_tasks: number;
  dependency_count: number;
  by_phase: Record<string, number>;
  by_trade: Record<string, number>;
  by_status: Record<string, number>;
  critical_path_length: number;
}

// Construction phase order (mirrors api/src/lib/blueprint-templates/types.ts PHASE_ORDER)
const PHASE_ORDER = [
  'site_prep', 'foundation', 'framing', 'roofing', 'rough_in',
  'inspections', 'insulation', 'drywall', 'finishes_interior',
  'finishes_exterior', 'sitework', 'commissioning', 'punch',
];

const PHASE_LABELS: Record<string, string> = {
  site_prep: 'Site Prep', foundation: 'Foundation', framing: 'Framing', roofing: 'Roofing',
  rough_in: 'Rough MEP', inspections: 'Inspections', insulation: 'Insulation', drywall: 'Drywall',
  finishes_interior: 'Interior', finishes_exterior: 'Exterior', sitework: 'Site Work',
  commissioning: 'Commissioning', punch: 'Punch', unassigned: 'Unassigned',
};

const STATUS_COLORS: Record<string, string> = {
  not_started: '#94a3b8',
  in_progress: '#3b82f6',
  on_hold: '#f59e0b',
  complete: '#22c55e',
};

const TRADE_COLORS: Record<string, string> = {
  general: '#64748b', civil: '#a16207', structural: '#7c3aed', concrete: '#6b7280',
  framing: '#b45309', roofing: '#dc2626', architectural: '#0891b2', electrical: '#eab308',
  plumbing: '#2563eb', hvac: '#0d9488', insulation: '#db2777', drywall: '#9333ea',
  finishes: '#16a34a',
  // T-64 taxonomy trades — family hues: sitework greens/browns, structural violets/oranges,
  // envelope reds, electrical yellows, plumbing blues, mechanical teals, interior pinks/greens.
  surveying: '#84cc16', excavation: '#a16207', demolition: '#78716c', erosion_control: '#4d7c0f',
  site_utilities: '#0f766e', deep_foundations: '#57534e', landscaping: '#15803d',
  asphalt_paving: '#525252', concrete_flatwork: '#9ca3af', pavement_marking: '#a3a3a3',
  rebar: '#71717a', waterproofing: '#0e7490', masonry: '#9f1239',
  truss_setting: '#ea580c', structural_steel: '#6d28d9', metal_decking: '#8b5cf6',
  metal_stud_framing: '#f97316', post_frame: '#c2410c',
  siding: '#be123c', stucco_eifs: '#be185d', gutters: '#ef4444', sheet_metal_flashing: '#b91c1c',
  air_barrier: '#f59e0b', curtain_wall: '#4f46e5', glazing: '#6366f1', windows: '#818cf8',
  exterior_doors: '#a78bfa', overhead_doors: '#94a3b8', skylights: '#e11d48',
  low_voltage: '#ca8a04', fire_alarm: '#f43f5e', security_access: '#fb923c',
  fire_sprinkler: '#1d4ed8', process_piping: '#1e40af', gas_piping: '#3b82f6',
  controls_bms: '#0891b2', test_balance: '#06b6d4', commissioning_agent: '#64748b',
  painting: '#ec4899', tile: '#f472b6', cabinetry: '#d946ef', millwork: '#c026d3',
  countertops: '#a21caf', finish_carpentry: '#fb7185', doors_hardware: '#fda4af',
  acoustical_ceilings: '#22d3ee', toilet_partitions: '#93c5fd',
  flooring_carpet: '#10b981', flooring_resilient: '#059669', flooring_epoxy: '#047857',
  final_clean: '#94a3b8',
};

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 96;
const NODE_WIDTH = 210;

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function OverviewGraph({ projectId }: { projectId: string }) {
  const { t } = useTranslation('projects');
  const [tasks, setTasks] = useState<OverviewTask[]>([]);
  const [deps, setDeps] = useState<OverviewDep[]>([]);
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<OverviewTask | null>(null);
  const [toast, setToast] = useState('');
  const [recomputing, setRecomputing] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/projects/${projectId}/overview`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error.message ?? 'Failed to load'); return; }
        setTasks(d.tasks ?? []);
        setDeps(d.dependencies ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(() => setError(t('overview.load_failed', { defaultValue: 'Failed to load overview' })));
  }, [projectId, t]);

  useEffect(() => { load(); }, [load]);

  // Phase-column auto-layout: x by phase index, y by row within phase.
  const nodes: Node[] = useMemo(() => {
    const presentPhases = PHASE_ORDER.filter((p) => tasks.some((t) => (t.phase ?? 'unassigned') === p));
    if (tasks.some((t) => !t.phase || !PHASE_ORDER.includes(t.phase))) presentPhases.push('unassigned');
    const colIndex = new Map(presentPhases.map((p, i) => [p, i]));
    const rowByPhase = new Map<string, number>();

    return tasks.map((task) => {
      const phase = task.phase && PHASE_ORDER.includes(task.phase) ? task.phase : 'unassigned';
      const col = colIndex.get(phase) ?? 0;
      const row = rowByPhase.get(phase) ?? 0;
      rowByPhase.set(phase, row + 1);
      const trade = task.trade_type ?? 'general';
      const tradeColor = TRADE_COLORS[trade] ?? '#64748b';
      const statusColor = STATUS_COLORS[task.status] ?? '#94a3b8';

      return {
        id: task.id,
        position: { x: col * COLUMN_WIDTH, y: row * ROW_HEIGHT },
        data: {
          label: (
            <div className="text-left">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: statusColor }} />
                <span className="text-[10px] uppercase tracking-wide text-gray-400 truncate">{trade}</span>
              </div>
              <div className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-2">{task.title}</div>
              {task.csi_division && <div className="text-[9px] text-gray-400 mt-0.5">{task.csi_division}</div>}
            </div>
          ),
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          width: NODE_WIDTH,
          padding: 8,
          borderRadius: 8,
          border: `1px solid ${tradeColor}`,
          borderLeft: `4px solid ${statusColor}`,
          background: '#fff',
          fontSize: 11,
        },
      };
    });
  }, [tasks]);

  const edges: Edge[] = useMemo(
    () => deps.map((d) => ({
      id: d.id,
      source: d.predecessor_task_id,
      target: d.successor_task_id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: d.origin === 'manual' ? '#2563eb' : '#cbd5e1', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: d.origin === 'manual' ? '#2563eb' : '#cbd5e1' },
    })),
    [deps],
  );

  const presentPhases = useMemo(() => {
    const list = PHASE_ORDER.filter((p) => tasks.some((t) => (t.phase ?? 'unassigned') === p));
    if (tasks.some((t) => !t.phase || !PHASE_ORDER.includes(t.phase))) list.push('unassigned');
    return list;
  }, [tasks]);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    const task = tasks.find((x) => x.id === node.id);
    if (task) setEditing(task);
  }, [tasks]);

  const flash = useCallback((msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 3500); }, []);

  // Drag from one task to another → create a manual prerequisite (source = predecessor).
  const onConnect = useCallback(async (conn: Connection) => {
    if (!conn.source || !conn.target) return;
    const res = await fetch('/api/task-dependencies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, predecessor_task_id: conn.source, successor_task_id: conn.target }),
    });
    if (res.ok) { flash(t('overview.dependency_created', { defaultValue: 'Dependency added' })); load(); return; }
    const d = await res.json().catch(() => ({}));
    const code = d?.error?.code;
    flash(
      code === 'DEPENDENCY_CYCLE' ? t('overview.dependency_cycle', { defaultValue: 'That would create a cycle' })
      : code === 'DEPENDENCY_EXISTS' ? t('overview.dependency_exists', { defaultValue: 'That dependency already exists' })
      : t('overview.dependency_failed', { defaultValue: 'Could not add dependency' })
    );
  }, [projectId, t, load, flash]);

  // Click an edge → remove that dependency (rule edges return on Recompute; manual stay gone).
  const onEdgeClick = useCallback(async (_: unknown, edge: Edge) => {
    if (!window.confirm(t('overview.delete_dependency_confirm', { defaultValue: 'Remove this dependency?' }))) return;
    const res = await fetch(`/api/task-dependencies/${edge.id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) { flash(t('overview.dependency_deleted', { defaultValue: 'Dependency removed' })); load(); }
    else flash(t('overview.dependency_failed', { defaultValue: 'Could not remove dependency' }));
  }, [t, load, flash]);

  // Re-run the rule engine over the current task order; preserves manual edges.
  const recompute = useCallback(async () => {
    if (!window.confirm(t('overview.recompute_confirm', { defaultValue: 'Regenerate auto dependencies from the current task order? Your manually-added edges are kept.' }))) return;
    setRecomputing(true);
    const res = await fetch(`/api/projects/${projectId}/schedule-tasks/recompute-dependencies`, { method: 'POST' });
    setRecomputing(false);
    if (res.ok) { flash(t('overview.recompute_done', { defaultValue: 'Dependencies regenerated' })); load(); }
    else flash(t('overview.recompute_failed', { defaultValue: 'Recompute failed' }));
  }, [projectId, t, load, flash]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/projects/${projectId}`} className="hover:text-gray-700">Project</Link>
            <span>›</span>
            <span>{t('overview.title', { defaultValue: 'Overview' })}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('overview.heading', { defaultValue: 'Project Overview' })}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void recompute()}
            disabled={recomputing || tasks.length === 0}
            className="text-sm rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {recomputing ? t('overview.recomputing', { defaultValue: 'Recomputing…' }) : t('overview.recompute', { defaultValue: '↻ Recompute from rules' })}
          </button>
          <Link href={`/projects/${projectId}/timeline`} className="text-sm text-gray-500 hover:text-gray-700">
            {t('timeline.title', { defaultValue: 'Timeline' })} →
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700">{error}</div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] rounded-md bg-gray-900 text-white text-sm px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}

      {/* Summary stat cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <StatCard label={t('overview.total_tasks', { defaultValue: 'Total tasks' })} value={summary.total_tasks} />
          <StatCard label={t('overview.dependencies', { defaultValue: 'Dependencies' })} value={summary.dependency_count} />
          <StatCard label={t('overview.critical_path', { defaultValue: 'Critical path (steps)' })} value={summary.critical_path_length} />
          <StatCard label={t('overview.phases', { defaultValue: 'Phases' })} value={Object.keys(summary.by_phase).length} />
          <StatCard label={t('overview.trades', { defaultValue: 'Trades' })} value={Object.keys(summary.by_trade).length} />
        </div>
      )}

      {/* Status legend */}
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            {t(`overview.status_labels.${status}`, { defaultValue: status.replace('_', ' ') })}
          </span>
        ))}
      </div>
      {tasks.length > 0 && (
        <p className="text-[11px] text-gray-400 mb-3">
          {t('overview.edit_hint', { defaultValue: 'Drag from one task to another to add a prerequisite · click an edge to remove it · edit a task’s order, then Recompute.' })}
        </p>
      )}

      {tasks.length > 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative" style={{ height: '70vh' }}>
          {/* Phase column headers */}
          <div className="absolute top-0 left-0 right-0 z-10 flex pointer-events-none px-2 pt-1">
            {presentPhases.map((p) => (
              <div key={p} style={{ width: COLUMN_WIDTH }} className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 truncate">
                {t(`overview.phase_labels.${p}`, { defaultValue: PHASE_LABELS[p] ?? p })}
              </div>
            ))}
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            fitView
            minZoom={0.1}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={(n) => {
              const task = tasks.find((x) => x.id === n.id);
              return STATUS_COLORS[task?.status ?? 'not_started'] ?? '#94a3b8';
            }} />
          </ReactFlow>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-16 text-center text-gray-400 text-sm">
          {t('overview.empty', { defaultValue: 'No tasks yet. Generate a task list from the Blueprints tab to populate the project graph.' })}
        </div>
      )}

      {/* Node detail/edit slide-over — rich panel (details + codes + photos + deps) */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-end z-50" onClick={() => setEditing(null)}>
          <div className="bg-white w-[30rem] max-w-full h-full shadow-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <Link href={`/projects/${projectId}/tasks/${editing.id}`} className="text-sm text-blue-600 hover:underline">
                {t('task_detail.open_full', { defaultValue: 'Open full detail →' })}
              </Link>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <TaskDetailPanel
              projectId={projectId}
              taskId={editing.id}
              variant="slideover"
              onSaved={() => load()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  return (
    <ReactFlowProvider>
      <OverviewGraph projectId={projectId} />
    </ReactFlowProvider>
  );
}
