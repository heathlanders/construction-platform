// In-house SVG donut / ratio gauge — theme-aware track, no dependency.

export function Donut({
  value,
  total,
  size = 96,
  thickness = 10,
  color = '#2563eb',
  label,
  className = '',
}: {
  value: number;
  total: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
  className?: string;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={label ?? `${Math.round(pct * 100)}%`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--c-border)" strokeWidth={thickness} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={`${(pct * c).toFixed(2)} ${c.toFixed(2)}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.24} fontWeight={700} fill="var(--c-text)">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
