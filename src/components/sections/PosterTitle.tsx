/**
 * Section headline in the poster style: a solid lead word and an accent word
 * either boxed (sun-orange in a hard-shadowed frame) or outlined.
 */
export default function PosterTitle({
  lead,
  accent,
  variant = "box",
  sub,
  align = "left",
  light = false,
}: {
  lead: string;
  accent: string;
  variant?: "box" | "outline";
  sub?: React.ReactNode;
  align?: "left" | "center";
  /** For dark/sea backgrounds. */
  light?: boolean;
}) {
  const leadColor = light ? "text-white" : "text-char";
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <h2 className={`display flex flex-wrap items-center gap-x-4 gap-y-2 text-[clamp(2.8rem,8vw,5.2rem)] ${align === "center" ? "justify-center" : ""}`}>
        <span className={leadColor}>{lead}</span>
        {variant === "box" ? (
          <span className="brut -rotate-1 bg-white px-3 pt-1 text-sun">{accent}</span>
        ) : (
          <span className={light ? "text-outline-light" : "text-outline"}>{accent}</span>
        )}
      </h2>
      {sub && (
        <p
          className={`mt-5 max-w-2xl text-lg font-bold leading-snug ${light ? "text-white/90" : "text-char/75"} ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
