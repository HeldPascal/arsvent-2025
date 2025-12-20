let cachedWebpSupport: boolean | null = null;

const detectWebpSupport = () => {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext) return false;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
};

export const supportsWebp = () => {
  if (cachedWebpSupport === null) {
    cachedWebpSupport = detectWebpSupport();
  }
  return cachedWebpSupport;
};

export const appendWebpFormat = (url: string) => {
  if (!supportsWebp()) return url;
  if (!url.includes("/content-asset/")) return url;
  const [base, hash] = url.split("#", 2);
  const joiner = base.includes("?") ? "&" : "?";
  return `${base}${joiner}format=webp${hash ? `#${hash}` : ""}`;
};
