// Tiny inline trend line — for KPI tiles / table cells. No dependency.

export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = '#2563eb',
  className = '',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  if (data.length < 2) return <span className={className} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const x = (i: number) => (i * width) / (data.length - 1);
  const y = (v: number) => 2 + (1 - (v - min) / span) * (height - 4);
  let d = '';
  data.forEach((v, i) => {
    d += `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
