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
  agency: "#0D0D0F",
  app: "#F6F7FB",
  aurora: "#0B0614",
  bold: "#FAFAF8",
  booking: "#F4F7F7",
  case: "#ffffff",
  contactsheet: "#F2F1EC",
  dock: "#000000",
  editorial: "#FAF6EF",
  filmstrip: "#0B0B0F",
  frames: "#EFEAE1",
  glass: "#05070C",
  grid: "#FBFBFA",
  journal: "#FDFCF8",
  launch: "#08080A",
  lookbook: "#0A0A0A",
  masonry: "#ffffff",
  menu: "#FCFBF7",
  minimal: "#ffffff",
  mono: "#0C0C0C",
  mosaic: "#0F0F12",
  neon: "#000000",
  orbit: "#0B0B0F",
  quote: "#F7F8F8",
  reel: "#0B0B0B",
  reply: "#F7F7FB",
  showcase: "#0C0A0B",
  split: "#ffffff",
  stack: "#ffffff",
  sticker: "#FFFDF5",
  studio: "#ffffff",
  tape: "#F4F1EA",
  tiles: "#F4F4F2",
  waitlist: "#08060F",
};

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
          />
      )}
      <Template {...props} />
      {card.logo_url && <LogoMark src={card.logo_url} tone={tone} />}
    </>
  );
}
