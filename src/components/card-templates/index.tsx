import type { CardProfile, ResolvedButton } from "@/lib/card";
import CoverBand from "@/components/nfc/CoverBand";
import LogoMark from "@/components/nfc/LogoMark";
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
import MasonryCard from "./MasonryCard";
import FilmstripCard from "./FilmstripCard";
import LookbookCard from "./LookbookCard";
import ContactSheetCard from "./ContactSheetCard";
import CaseCard from "./CaseCard";
import MosaicCard from "./MosaicCard";
import FramesCard from "./FramesCard";
import MenuCard from "./MenuCard";
import LaunchCard from "./LaunchCard";
import StudioCard from "./StudioCard";
import JournalCard from "./JournalCard";
import QuoteCard from "./QuoteCard";

/**
 * Templates that build the cover photo into their own layout. Everything else
 * gets the shared band, because otherwise the field silently does nothing.
 */
export const TEMPLATES_WITH_OWN_COVER = new Set([
  "agency",
  "app",
  "booking",
  "glass",
  "poster",
  "showcase",
]);

/**
 * The colour each template's page starts with, so the cover band can fade into
 * it. Read off the template's own root background.
 */
export const TEMPLATE_TONE: Record<string, string> = {
  minimal: "#ffffff",
  bold: "#ffffff",
  split: "#ffffff",
  mono: "#0a0a0a",
  sticker: "#FFFDF5",
  aurora: "#0B0B0F",
  editorial: "#FBF9F4",
  neon: "#07070A",
  tape: "#FAF7F0",
  pitch: "#ffffff",
  waitlist: "#ffffff",
  grid: "#ffffff",
  stack: "#ffffff",
  reply: "#ffffff",
  reel: "#0A0A0A",
  orbit: "#0B0B0F",
  tiles: "#F4F4F2",
  dock: "#000000",
  masonry: "#ffffff",
  filmstrip: "#0B0B0F",
  lookbook: "#0A0A0A",
  contactsheet: "#F2F1EC",
  case: "#ffffff",
  mosaic: "#0F0F12",
  frames: "#EFEAE1",
  menu: "#FCFBF7",
  launch: "#08080A",
  studio: "#ffffff",
  journal: "#FDFCF8",
  quote: "#F7F8F8",
};

export type CardTemplateProps = {
  card: CardProfile;
  buttons: ResolvedButton[];
};

/**
 * The content column each template lays out in, so the cover band can match it.
 * Read off each template's own `max-w-*`; anything missing falls back to md.
 */
export const TEMPLATE_WIDTH: Record<string, string> = {
  aurora: "max-w-sm",
  dock: "max-w-sm",
  editorial: "max-w-sm",
  glass: "max-w-sm",
  minimal: "max-w-sm",
  neon: "max-w-sm",
  orbit: "max-w-sm",
  pitch: "max-w-sm",
  sticker: "max-w-sm",
  tape: "max-w-sm",
  tiles: "max-w-sm",
  waitlist: "max-w-sm",
  split: "max-w-lg",
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
  masonry: MasonryCard,
  filmstrip: FilmstripCard,
  lookbook: LookbookCard,
  contactsheet: ContactSheetCard,
  case: CaseCard,
  mosaic: MosaicCard,
  frames: FramesCard,
  menu: MenuCard,
  launch: LaunchCard,
  studio: StudioCard,
  journal: JournalCard,
  quote: QuoteCard,
};

/** Falls back to Minimal so an unknown template id never blanks a card. */
export function renderCardTemplate(props: CardTemplateProps) {
  const Template = TEMPLATES[props.card.template] ?? MinimalCard;
  const { card } = props;

  // The band lives here rather than on the public page, so a cover shows up
  // in the editor preview too. Uploading one and seeing nothing change is how
  // you conclude the feature is broken.
  const needsBand =
    Boolean(card.cover_url) && !TEMPLATES_WITH_OWN_COVER.has(card.template);
  const tone = TEMPLATE_TONE[card.template] ?? "#ffffff";

  if (!needsBand && !card.logo_url) return <Template {...props} />;

  return (
    <>
      {needsBand && (
        <CoverBand
          src={card.cover_url as string}
          tone={tone}
          width={TEMPLATE_WIDTH[card.template] ?? "max-w-md"}
        />
      )}
      <Template {...props} />
      {card.logo_url && <LogoMark src={card.logo_url} tone={tone} />}
    </>
  );
}
