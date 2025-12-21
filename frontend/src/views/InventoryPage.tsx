import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchInventory } from "../services/api";
import type { InventoryResponse, User } from "../types";
import { useI18n } from "../i18n";

interface Props {
  user: User;
}

const normalizeRarity = (value: string) => value.trim().toLowerCase();

export default function InventoryPage({ user }: Props) {
  const { t } = useI18n();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string>("all");

  const backendBase = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ?? "";
  const resolveAsset = (src?: string) =>
    src && backendBase
      ? src.startsWith("/content-asset/")
        ? `${backendBase}${src}`
        : src
      : src ?? "";

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setLoading(true);
        setError(null);
      })
      .then(() => fetchInventory())
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t("inventoryLoadFailed"));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const tagOptions = useMemo(() => {
    const used = new Set<string>();
    items.forEach((item) => (item.tags ?? []).forEach((tag) => used.add(tag)));
    const tags = data?.tags ?? [];
    if (tags.length > 0) {
      return tags.filter((tag) => used.has(tag.id));
    }
    return Array.from(used)
      .map((id) => ({ id, title: id }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [data, items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tagFilter !== "all") {
        const tags = new Set(item.tags ?? []);
        if (!tags.has(tagFilter)) return false;
      }
      return true;
    });
  }, [items, tagFilter]);

  const selectTag = (tag: string) => {
    setTagFilter(tag);
  };

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">
              {user.locale.toUpperCase()} · {user.mode}
            </div>
            <h2>{t("inventoryTitle")}</h2>
            <p className="muted">
              {data?.day ? t("inventorySubtitle", { day: data.day }) : t("inventoryEmptySubtitle")}
            </p>
          </div>
          <div className="panel-actions" style={{ flexWrap: "wrap", gap: 8 }}>
            <Link className="ghost nav-link" to="/calendar">
              {t("backToCalendar")}
            </Link>
          </div>
        </header>

        {tagOptions.length > 0 && (
          <div className="inventory-tags-filter">
            <div className="muted small inventory-count">
              {t("inventoryCount", { count: filtered.length, total: items.length })}
            </div>
            <div className="segmented segmented-strong segmented-fit">
              <button
                key="all"
                type="button"
                className={tagFilter === "all" ? "active" : ""}
                onClick={() => selectTag("all")}
              >
                {t("inventoryTagAll")}
              </button>
              {tagOptions.map((tag) => {
                const active = tagFilter === tag.id;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={active ? "active" : ""}
                    onClick={() => selectTag(tag.id)}
                  >
                    {tag.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && <div className="muted">{t("loading")}</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="muted">{t("inventoryEmpty")}</div>
        )}

        {filtered.length > 0 && (
          <div className="inventory-list" style={{ marginTop: 10 }}>
            {filtered.map((item) => (
              <div key={item.id} className="inventory-row" tabIndex={0}>
                <div className="inventory-row-main">
                  {item.image ? (
                    <img
                      src={resolveAsset(item.image)}
                      alt={item.title}
                      className="inventory-icon"
                      data-rarity={normalizeRarity(item.rarity)}
                      onError={(event) => {
                        (event.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="inventory-icon inventory-icon-empty" />
                  )}
                  <div className="inventory-title">{item.title}</div>
                </div>
                <div className="inventory-tooltip" role="tooltip" data-rarity={normalizeRarity(item.rarity)}>
                  <div className="inventory-tooltip-header">
                    {item.image ? (
                      <img
                        src={resolveAsset(item.image)}
                        alt={item.title}
                        className="inventory-tooltip-icon"
                        data-rarity={normalizeRarity(item.rarity)}
                      />
                    ) : (
                      <div className="inventory-tooltip-icon inventory-icon-empty" />
                    )}
                    <div className="inventory-tooltip-title">{item.title}</div>
                  </div>
                  <div className="inventory-tooltip-desc">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
