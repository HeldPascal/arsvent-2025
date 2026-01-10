import { useEffect, useRef, useState } from "react";
import AssetPicture from "./AssetPicture";

type AssetOption = {
  id: string;
  label: string;
  name: string;
  variants: Array<{ ext: string; mime: string; size: number }>;
  variantUrls: string[];
  baseVariantIndex?: number;
};

type Props = {
  options: AssetOption[];
  value: string | null;
  onChange: (next: string | null) => void;
};

export default function AssetPicker({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.id === value) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) =>
        [option.label, option.name, option.id].some((field) =>
          field.toLowerCase().includes(normalizedQuery),
        ),
      )
    : options;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="asset-picker" ref={wrapperRef}>
      <button
        className="asset-picker-trigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        {selected ? (
          <>
            <span className="asset-picker-thumb">
              <AssetPicture
                variants={selected.variants}
                variantUrls={selected.variantUrls}
                baseVariantIndex={selected.baseVariantIndex}
                alt={selected.name}
              />
            </span>
            <span className="asset-picker-label">{selected.label}</span>
          </>
        ) : (
          <span className="asset-picker-placeholder">No image</span>
        )}
      </button>
      {open && (
        <div className="asset-picker-popover">
          <div className="asset-picker-search">
            <input
              type="search"
              placeholder="Search assets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button
            className={`asset-picker-option${value === null ? " selected" : ""}`}
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <span className="asset-picker-placeholder">No image</span>
          </button>
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              className={`asset-picker-option${value === option.id ? " selected" : ""}`}
              type="button"
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              <span className="asset-picker-thumb">
                <AssetPicture
                  variants={option.variants}
                  variantUrls={option.variantUrls}
                  baseVariantIndex={option.baseVariantIndex}
                  alt={option.name}
                />
              </span>
              <span className="asset-picker-label">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
