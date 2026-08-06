import Image from "next/image";

/**
 * The full ScorlynTap lockup — mark and wordmark as one supplied artwork.
 *
 * Used where the brand is the subject rather than chrome: the auth screens.
 * Elsewhere BrandMark plus live text is better, because real text stays sharp
 * at any size, is selectable, and matches the surrounding weight.
 */
export default function BrandLockup({
  width = 190,
  className = "",
}: {
  width?: number;
  className?: string;
}) {
  // Native artwork is 1272x377, trimmed to the mark and wordmark.
  const height = Math.round((width * 377) / 1272);

  return (
    <Image
      src="/logo-wordmark.png"
      alt="ScorlynTap"
      width={width}
      height={height}
      priority
      className={className}
      style={{ width, height: "auto" }}
    />
  );
}
