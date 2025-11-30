import { useState } from "react";

interface Props {
  title: string;
  values: number[];
  labelPrefix?: string;
}

export default function CollapsibleHistogram({ title, values, labelPrefix }: Props) {
  const [open, setOpen] = useState(false);
  const maxVal = Math.max(...values);

  return (
    <div className={`hist-panel ${open ? "open" : ""}`}>
      <button className="hist-toggle" type="button" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className="hist-toggle-icon">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="hist-body">
          <div className="hist-caption">{title}</div>
          <div className="histogram" aria-label={title}>
            {values.map((count, idx) => (
              <div key={idx} className="hist-bar" title={`${labelPrefix ? `${labelPrefix} ` : ""}${idx}: ${count}`}>
                <div className="hist-fill" style={{ height: maxVal > 0 ? `${(count / maxVal) * 120}px` : 0 }} aria-hidden />
                <span className="hist-label">{labelPrefix ? `${labelPrefix} ${idx}` : idx}</span>
                <span className="hist-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
