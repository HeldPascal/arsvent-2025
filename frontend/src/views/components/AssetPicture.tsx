type AssetVariant = {
  ext: string;
  mime: string;
  size: number;
};

type AssetPictureProps = {
  variants: AssetVariant[];
  variantUrls: string[];
  baseVariantIndex?: number;
  alt: string;
  className?: string;
};

export default function AssetPicture({
  variants,
  variantUrls,
  baseVariantIndex = 0,
  alt,
  className,
}: AssetPictureProps) {
  const baseUrl = variantUrls[baseVariantIndex] ?? variantUrls[0] ?? "";
  const sources = variants
    .map((variant, idx) => ({ variant, url: variantUrls[idx], idx }))
    .filter(({ url, idx }) => Boolean(url) && idx !== baseVariantIndex);
  const sortedSources = sources
    .filter(({ variant }) => variant.mime === "image/webp")
    .concat(sources.filter(({ variant }) => variant.mime !== "image/webp"));
  return (
    <picture className={className}>
      {sortedSources.map(({ variant, url }, idx) => (
        <source key={`${variant.ext}-${idx}`} srcSet={url} type={variant.mime} />
      ))}
      <img src={baseUrl} alt={alt} />
    </picture>
  );
}
