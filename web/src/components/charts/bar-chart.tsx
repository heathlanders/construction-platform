// In-house SVG bar chart — theme-aware, no dependency.

export function BarChart({
  data,
  height = 160,
  color = '#2563eb',
  className = '',
  ariaLabel = 'Bar chart',
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const W = 600;
  const H = height;
  const padTop = 10;
  const padBottom = 22;
  if (data.length === 0) return <div className={className} style={{ height }} />;

  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = W / data.length;
  const bw = Math.min(48, slot * 0.6);
  const plot = H - padTop - padBottom;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`w-full ${className}`} style={{ height }} role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      {[0, 0.5, 1].map((f, i) => {
        const gy = (padTop + f * plot).toFixed(1);
        return <line key={i} x1={0} x2={W} y1={gy} y2={gy} stroke="var(--c-border)" strokeWidth={1} />;
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * plot;
        const cx = i * slot + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={padTop + plot - h} width={bw} height={Math.max(0, h)} rx={4} fill={color} />
            <text x={cx} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--c-text-muted)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
