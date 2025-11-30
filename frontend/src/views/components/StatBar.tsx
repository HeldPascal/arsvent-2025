interface Props {
  label: string;
  segments: Array<{ label: string; value: number; color: string }>;
  total: number;
}

export default function StatBar({ label, segments, total }: Props) {
  return (
    <div className="statbar">
      <div className="statbar-header">
        <span className="statbar-label">{label}</span>
        <span className="statbar-total">{total}</span>
      </div>
      <div className="statbar-track">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.max((seg.value / total) * 100, 2) : 0;
          return (
            <div
              key={seg.label}
              className="statbar-segment"
              style={{ width: `${pct}%`, background: seg.color }}
              title={`${seg.label}: ${seg.value}`}
            />
          );
        })}
      </div>
      <div className="statbar-legend">
        {segments.map((seg) => (
          <span key={seg.label} className="statbar-pill">
            <span className="statbar-dot" style={{ background: seg.color }} />
            {seg.label}: {seg.value}
          </span>
        ))}
      </div>
    </div>
  );
}
