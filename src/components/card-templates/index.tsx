import type { CardProfile, ResolvedButton } from "@/lib/card";
import MinimalCard from "./MinimalCard";
import BoldCard from "./BoldCard";
import SplitCard from "./SplitCard";
import GlassCard from "./GlassCard";
import MonoCard from "./MonoCard";
import StickerCard from "./StickerCard";
import AuroraCard from "./AuroraCard";
import EditorialCard from "./EditorialCard";
import NeonCard from "./NeonCard";
import TapeCard from "./TapeCard";
import PitchCard from "./PitchCard";
import WaitlistCard from "./WaitlistCard";
import GridCard from "./GridCard";
import ShowcaseCard from "./ShowcaseCard";
import StackCard from "./StackCard";
import ReplyCard from "./ReplyCard";
import PosterCard from "./PosterCard";
import AppCard from "./AppCard";
import ReelCard from "./ReelCard";
import AgencyCard from "./AgencyCard";
import BookingCard from "./BookingCard";
import OrbitCard from "./OrbitCard";
import TilesCard from "./TilesCard";
import DockCard from "./DockCard";

export type CardTemplateProps = {
  card: CardProfile;
  buttons: ResolvedButton[];
};

const TEMPLATES: Record<string, React.ComponentType<CardTemplateProps>> = {
  minimal: MinimalCard,
  bold: BoldCard,
  split: SplitCard,
  glass: GlassCard,
  mono: MonoCard,
  sticker: StickerCard,
  aurora: AuroraCard,
  editorial: EditorialCard,
  neon: NeonCard,
  tape: TapeCard,
  pitch: PitchCard,
  waitlist: WaitlistCard,
  grid: GridCard,
  showcase: ShowcaseCard,
  stack: StackCard,
  reply: ReplyCard,
  poster: PosterCard,
  app: AppCard,
  reel: ReelCard,
  agency: AgencyCard,
  booking: BookingCard,
  orbit: OrbitCard,
  tiles: TilesCard,
  dock: DockCard,
};

/** Falls back to Minimal so an unknown template id never blanks a card. */
export function renderCardTemplate(props: CardTemplateProps) {
  const Template = TEMPLATES[props.card.template] ?? MinimalCard;
  return <Template {...props} />;
}
