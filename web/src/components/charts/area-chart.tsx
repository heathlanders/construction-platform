// In-house SVG area chart — no dependency. Theme-aware (grid/labels via CSS vars),
// area fill + emphasized endpoint per the dataviz skill. Responsive via viewBox.

export function AreaChart({
  data,
  labels,
  height = 140,
  color = '#2563eb',
  className = '',
  ariaLabel = 'Trend chart',
}: {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const W = 600;
  const H = height;
  const padX = 8;
  const padTop = 10;
  const padBottom = labels ? 20 : 8;
  if (data.length < 2) return <div className={className} style={{ height }} />;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const x = (i: number) => padX + (i * (W - padX * 2)) / (data.length - 1);
  const y = (v: number) => padTop + (1 - (v - min) / span) * (H - padTop - padBottom);

  let line = '';
  data.forEach((v, i) => {
    line += `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
  });
  const area = `${line}L${x(data.length - 1).toFixed(1)} ${H - padBottom} L${x(0).toFixed(1)} ${H - padBottom} Z`;
  const gid = `ac-${Math.round(min)}-${Math.round(max)}-${data.length}`;

  const gridLines = [0, 0.5, 1].map((f, i) => {
    const gy = (padTop + f * (H - padTop - padBottom)).toFixed(1);
    return <line key={i} x1={0} x2={W} y1={gy} y2={gy} stroke="var(--c-border)" strokeWidth={1} />;
  });

  const ex = x(data.length - 1);
  const ey = y(data[data.length - 1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`w-full ${className}`} style={{ height }} role="img" aria-label={ariaLabel} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridLines}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r={7} fill={color} opacity={0.18} />
      <circle cx={ex} cy={ey} r={3.5} fill={color} />
      {labels &&
        labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--c-text-muted)">
            {l}
          </text>
        ))}
    </svg>
  );
}
