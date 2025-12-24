import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEpilogue } from "../services/api";
import type { User } from "../types";
import { useI18n } from "../i18n";
import { appendWebpFormat } from "../utils/assets";

type EpilogueSegment =
  | { kind: "html"; html: string }
  | {
      kind: "video";
      sources: Array<{ src: string; type?: string }>;
      poster?: string;
      preload?: string;
      controls?: boolean;
      muted?: boolean;
      loop?: boolean;
      autoPlay?: boolean;
      playsInline?: boolean;
    };

const buildSegments = (html: string): EpilogueSegment[] => {
  if (!html.trim() || typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html.trim() ? [{ kind: "html", html }] : [];
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const segments: EpilogueSegment[] = [];
  let buffer = "";

  const flushBuffer = () => {
    if (buffer.trim()) {
      segments.push({ kind: "html", html: buffer });
    }
    buffer = "";
  };

  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (element.tagName.toLowerCase() === "video") {
        flushBuffer();
        const video = element as HTMLVideoElement;
        const sources: Array<{ src: string; type?: string }> = [];
        const directSrc = video.getAttribute("src");
        if (directSrc) {
          sources.push({ src: directSrc, type: video.getAttribute("type") ?? undefined });
        }
        video.querySelectorAll("source").forEach((source) => {
          const src = source.getAttribute("src");
          if (!src) return;
          sources.push({ src, type: source.getAttribute("type") ?? undefined });
        });
        segments.push({
          kind: "video",
          sources,
          poster: video.getAttribute("poster") ?? undefined,
          preload: video.getAttribute("preload") ?? undefined,
          controls: video.hasAttribute("controls"),
          muted: video.hasAttribute("muted"),
          loop: video.hasAttribute("loop"),
          autoPlay: video.hasAttribute("autoplay"),
          playsInline: video.hasAttribute("playsinline"),
        });
        return;
      }
      buffer += element.outerHTML;
      return;
    }
    buffer += node.textContent ?? "";
  });

  flushBuffer();
  return segments;
};

interface Props {
  user: User;
}

export default function EpiloguePage({ user }: Props) {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);

  useEffect(() => {
    if (user.locale && user.locale !== locale) {
      setLocale(user.locale);
    }
  }, [user.locale, locale, setLocale]);

  const rewriteAssets = useCallback(
    (html: string) => {
      if (!backendBase) return html;
      let out = html.replace(
        /src=(["'])(\/assets\/[^"']+)\1/g,
        (_m, quote, path) => `src=${quote}${backendBase}/content-${path.slice(1)}${quote}`,
      );
      out = out.replace(
        /src=(["'])(\/content-asset\/[^"']+)\1/g,
        (_m, quote, path) => `src=${quote}${appendWebpFormat(`${backendBase}${path}`)}${quote}`,
      );
      out = out.replace(
        /srcset=(["'])([^"']+)\1/gi,
        (_m, quote, val) => {
          const rewritten = val
            .split(",")
            .map((part: string) => {
              const [urlRaw, size] = part.trim().split(/\s+/, 2);
              const url = urlRaw ?? "";
              const masked = url.startsWith("/assets/")
                ? `${backendBase}/content-${url.slice(1)}`
                : url.startsWith("/content-asset/")
                  ? appendWebpFormat(`${backendBase}${url}`)
                  : url;
              return size ? `${masked} ${size}` : masked;
            })
            .join(", ");
          return `srcset=${quote}${rewritten}${quote}`;
        },
      );
      out = out.replace(/url\((['"]?)(\/content-asset\/[^'")]+)\1\)/gi, (_m, quote, path) => {
        return `url(${quote}${appendWebpFormat(`${backendBase}${path}`)}${quote})`;
      });
      out = out.replace(/url\((['"]?)(\/assets\/[^'")]+)\1\)/gi, (_m, quote, path) => {
        return `url(${quote}${backendBase}/content-${path.slice(1)}${quote})`;
      });
      return out;
    },
    [backendBase],
  );
  const resolveAsset = useCallback(
    (src?: string) =>
      src && backendBase
        ? src.startsWith("/assets/")
          ? `${backendBase}/content-${src.slice(1)}`
          : src.startsWith("/content-asset/")
            ? appendWebpFormat(`${backendBase}${src}`)
            : src
        : src ?? "",
    [backendBase],
  );

  const segments = useMemo(() => buildSegments(body), [body]);

  useEffect(() => {
    fetchEpilogue()
      .then((data) => {
        setTitle(data.title);
        setBody(rewriteAssets(data.body));
      })
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [rewriteAssets, t]);

  if (loading) return <div className="panel">{t("loading")}</div>;
  if (error) return <div className="panel error">{error}</div>;

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">{t("epilogueLabel")}</div>
          <h2>{title}</h2>
        </div>
        <div className="panel-actions">
          <button className="ghost nav-link" onClick={() => navigate("/calendar")}>
            {t("backToCalendar")}
          </button>
        </div>
      </header>

      {segments.map((segment, index) => {
        if (segment.kind === "video") {
          const resolvedSources = segment.sources
            .map((source) => ({
              ...source,
              src: resolveAsset(source.src),
            }))
            .filter((source) => source.src);
          const poster = segment.poster ? resolveAsset(segment.poster) : undefined;
          if (resolvedSources.length === 0) return null;
          return (
            <div key={`segment-${index}`} className="riddle-body">
              <video
                controls={segment.controls ?? true}
                muted={segment.muted}
                loop={segment.loop}
                autoPlay={segment.autoPlay}
                playsInline={segment.playsInline ?? true}
                preload={segment.preload ?? "metadata"}
                poster={poster}
                style={{ width: "100%", height: "auto", borderRadius: 12 }}
              >
                {resolvedSources.map((source) => (
                  <source key={source.src} src={source.src} type={source.type} />
                ))}
              </video>
            </div>
          );
        }
        return (
          <div key={`segment-${index}`} className="riddle-body" dangerouslySetInnerHTML={{ __html: segment.html }} />
        );
      })}
    </div>
  );
}
