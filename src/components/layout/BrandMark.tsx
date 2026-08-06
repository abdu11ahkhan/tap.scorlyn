import Image from "next/image";

/**
 * The ScorlynTap mark.
 *
 * One component for all five places the logo appears, so replacing the artwork
 * is a single edit. The source is a transparent white PNG keyed out of the
 * supplied PDF, which is why it takes its colour from whatever sits behind it
 * rather than carrying its own background.
 */
export default function BrandMark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-mark.png"
        alt=""
        width={size}
        height={size}
        priority
        className="h-full w-full object-contain p-[12%]"
      />
    </span>
  );
}
