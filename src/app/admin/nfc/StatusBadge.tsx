import { CARD_STATUS_LABEL, type CardStatus } from "@/lib/card-codes";

const TONE: Record<CardStatus, string> = {
  active: "border-acid/60 bg-acid/10 text-acid",
  in_stock: "border-sc-border text-sc-text-dim",
  claimed: "border-sc-gold/60 bg-sc-gold/10 text-sc-gold-text",
  suspended: "border-hotpink/60 bg-hotpink/10 text-hotpink",
  retired: "border-sc-border-soft text-sc-text-dimmer line-through",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = (status in TONE ? status : "in_stock") as CardStatus;
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${TONE[s]}`}
    >
      {CARD_STATUS_LABEL[s]}
    </span>
  );
}
