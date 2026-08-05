import type { CardButton } from "@/lib/card";

/**
 * A distinct persona per template.
 *
 * Every preview used to show the same estate agent, so twenty-one templates
 * read as one design in twenty-one colours. Giving each its own occupation,
 * city, copy length and link set is what actually makes them look different —
 * a photographer's page and a dentist's page want different shapes.
 *
 * All fictional. Numbers are the reserved 03xx-0000000 pattern so nobody's
 * real phone gets dialled from a demo.
 */
export type DemoPersona = {
  username: string;
  full_name: string;
  headline: string;
  company: string;
  bio: string;
  location: string;
  whatsapp: string;
  phone: string;
  email: string;
  buttons: CardButton[];
  captions?: string[];
};

const wa = (n: string) => `92300000${n}`;
const tel = (n: string) => `+92 300 000${n}`;

function person(
  p: Omit<DemoPersona, "whatsapp" | "phone" | "email" | "buttons"> & {
    n: string;
    links: [string, CardButton["kind"], string][];
  }
): DemoPersona {
  const { n, links, ...rest } = p;
  return {
    ...rest,
    whatsapp: wa(n),
    phone: tel(n),
    email: `${rest.username}@example.pk`,
    buttons: links.map(([label, kind, value]) => ({ label, kind, value })),
  };
}

export const DEMO_PERSONAS: Record<string, DemoPersona> = {
  // ---------------- Profile ----------------
  minimal: person({
    n: "0001",
    username: "ayesha",
    full_name: "Ayesha Siddiqui",
    headline: "Real Estate Consultant",
    company: "Skyline Properties",
    bio: "Helping families find homes in DHA and Bahria Town since 2018. Over 300 closings and counting.",
    location: "Islamabad",
    links: [
      ["WhatsApp", "whatsapp", wa("0001")],
      ["Call", "phone", tel("0001")],
      ["Listings", "link", "https://example.pk/listings"],
      ["Instagram", "instagram", "https://instagram.com/example"],
    ],
  }),

  bold: person({
    n: "0002",
    username: "hamza",
    full_name: "Hamza Tariq",
    headline: "Creative Director",
    company: "Nova Studio",
    bio: "Brand systems for Pakistani startups. Previously at Daraz and Careem.",
    location: "Karachi",
    links: [
      ["Book a call", "link", "https://example.pk/call"],
      ["Portfolio", "link", "https://example.pk"],
      ["LinkedIn", "linkedin", "https://linkedin.com/in/example"],
      ["Email", "email", "hamza@example.pk"],
    ],
  }),

  split: person({
    n: "0003",
    username: "drsana",
    full_name: "Dr. Sana Malik",
    headline: "Consultant Dermatologist",
    company: "Gulberg Skin Clinic",
    bio: "MBBS, FCPS. Clinic hours Mon–Sat, 4pm to 9pm. Walk-ins welcome after 7.",
    location: "Lahore",
    links: [
      ["WhatsApp", "whatsapp", wa("0003")],
      ["Clinic", "phone", tel("0003")],
      ["Directions", "link", "https://example.pk/map"],
      ["Email", "email", "drsana@example.pk"],
    ],
  }),

  glass: person({
    n: "0004",
    username: "bilal",
    full_name: "Bilal Ahmed",
    headline: "Product Designer",
    company: "Tez Financial",
    bio: "Designing payments for people who've never used a bank app before.",
    location: "Karachi",
    links: [
      ["Portfolio", "link", "https://example.pk"],
      ["Dribbble", "link", "https://dribbble.com/example"],
      ["LinkedIn", "linkedin", "https://linkedin.com/in/example"],
      ["Email", "email", "bilal@example.pk"],
    ],
  }),

  mono: person({
    n: "0005",
    username: "usmanr",
    full_name: "Usman Raza",
    headline: "Backend Engineer",
    company: "Systems Ltd",
    bio: "Go, Postgres, and too much time in pg_stat_statements. Open to consulting.",
    location: "Islamabad",
    links: [
      ["GitHub", "github", "https://github.com/example"],
      ["Blog", "link", "https://example.pk/blog"],
      ["X", "x", "https://x.com/example"],
      ["Email", "email", "usman@example.pk"],
    ],
  }),

  sticker: person({
    n: "0006",
    username: "zoya",
    full_name: "Zoya Khan",
    headline: "Illustrator",
    company: "Freelance",
    bio: "Truck-art inspired illustration. Murals, book covers, and the odd album sleeve.",
    location: "Lahore",
    links: [
      ["Instagram", "instagram", "https://instagram.com/example"],
      ["Shop prints", "link", "https://example.pk/shop"],
      ["WhatsApp", "whatsapp", wa("0006")],
      ["Email", "email", "zoya@example.pk"],
    ],
  }),

  aurora: person({
    n: "0007",
    username: "mahnoor",
    full_name: "Mahnoor Fatima",
    headline: "DJ & Producer",
    company: "Rooftop Sessions",
    bio: "House and desi breaks. Residencies in Karachi and Dubai.",
    location: "Karachi",
    links: [
      ["Latest mix", "link", "https://example.pk/mix"],
      ["Bookings", "whatsapp", wa("0007")],
      ["Instagram", "instagram", "https://instagram.com/example"],
      ["Spotify", "link", "https://example.pk/spotify"],
    ],
  }),

  editorial: person({
    n: "0008",
    username: "imranq",
    full_name: "Imran Qureshi",
    headline: "Author & Columnist",
    company: "Dawn",
    bio: "Writing on cities, water, and the people who move between them. Third book out this winter.",
    location: "Lahore",
    links: [
      ["Read my columns", "link", "https://example.pk/columns"],
      ["The books", "link", "https://example.pk/books"],
      ["X", "x", "https://x.com/example"],
      ["Email", "email", "imran@example.pk"],
    ],
  }),

  neon: person({
    n: "0009",
    username: "alihasan",
    full_name: "Ali Hasan",
    headline: "Night Photographer",
    company: "After Hours",
    bio: "Long exposures of Karachi after midnight. Prints and commissions.",
    location: "Karachi",
    links: [
      ["Instagram", "instagram", "https://instagram.com/example"],
      ["Prints", "link", "https://example.pk/prints"],
      ["WhatsApp", "whatsapp", wa("0009")],
    ],
  }),

  tape: person({
    n: "0010",
    username: "fatimanoor",
    full_name: "Fatima Noor",
    headline: "Wedding Planner",
    company: "Shaadi Studio",
    bio: "Mehndi to rukhsati, handled. 60+ weddings across Punjab since 2019.",
    location: "Multan",
    links: [
      ["WhatsApp", "whatsapp", wa("0010")],
      ["Real weddings", "link", "https://example.pk/weddings"],
      ["Instagram", "instagram", "https://instagram.com/example"],
      ["Call", "phone", tel("0010")],
    ],
  }),

  // ---------------- Landing ----------------
  pitch: person({
    n: "0011",
    username: "riderx",
    full_name: "Hassan Sheikh",
    headline: "Same-day delivery across Lahore, from Rs.120",
    company: "RiderX",
    bio: "We move parcels for 400+ small businesses. Book on WhatsApp, tracked end to end.",
    location: "Lahore",
    links: [
      ["Book a pickup", "whatsapp", wa("0011")],
      ["Pricing", "link", "https://example.pk/pricing"],
      ["Coverage areas", "link", "https://example.pk/areas"],
      ["Email", "email", "hassan@example.pk"],
    ],
  }),

  waitlist: person({
    n: "0012",
    username: "sabzi",
    full_name: "Ayla Junaid",
    headline: "Fresh sabzi, at your door by 8am",
    company: "Sabzi",
    bio: "We buy at the mandi at 4am so you don't have to. Launching in Karachi this spring.",
    location: "Karachi",
    links: [
      ["Instagram", "instagram", "https://instagram.com/example"],
      ["WhatsApp", "whatsapp", wa("0012")],
      ["X", "x", "https://x.com/example"],
    ],
  }),

  poster: person({
    n: "0013",
    username: "rohail",
    full_name: "Rohail Aziz",
    headline: "Qawwali Nights — every Friday at Alhamra",
    company: "Lahore Live",
    bio: "Doors 8pm. Limited seating, no entry after 9. Tickets Rs.1,500.",
    location: "Lahore",
    links: [
      ["Get tickets", "link", "https://example.pk/tickets"],
      ["WhatsApp", "whatsapp", wa("0013")],
      ["Instagram", "instagram", "https://instagram.com/example"],
    ],
  }),

  app: person({
    n: "0014",
    username: "khata",
    full_name: "Khata",
    headline: "Udhaar ka hisaab, phone pe",
    company: "Khata Technologies",
    bio: "Free bookkeeping for kiryana stores. Works offline, syncs when you get signal.",
    location: "Karachi",
    links: [
      ["Download free", "link", "https://example.pk/download"],
      ["Works offline", "link", "https://example.pk/offline"],
      ["Urdu & English", "link", "https://example.pk/urdu"],
      ["Support", "whatsapp", wa("0014")],
    ],
  }),

  // ---------------- Portfolio ----------------
  grid: person({
    n: "0015",
    username: "hirab",
    full_name: "Hira Baloch",
    headline: "Architect",
    company: "Baloch & Partners",
    bio: "Residential and civic work in Balochistan. Mud brick, stone, and shade.",
    location: "Quetta",
    links: [
      ["Full portfolio", "link", "https://example.pk"],
      ["LinkedIn", "linkedin", "https://linkedin.com/in/example"],
      ["Email", "email", "hira@example.pk"],
    ],
    captions: ["Hanna Valley House", "Quetta Library", "Ziarat Retreat", "Sariab Clinic"],
  }),

  showcase: person({
    n: "0016",
    username: "danishali",
    full_name: "Danish Ali",
    headline: "Landscape Photographer",
    company: "North Frames",
    bio: "Eight seasons in Gilgit-Baltistan. Print sales fund the next trip.",
    location: "Hunza",
    links: [
      ["Buy prints", "link", "https://example.pk/prints"],
      ["Instagram", "instagram", "https://instagram.com/example"],
      ["Workshops", "link", "https://example.pk/workshops"],
    ],
    captions: ["Attabad Lake", "Rakaposhi at dawn", "Passu Cones", "Khunjerab Pass"],
  }),

  reel: person({
    n: "0017",
    username: "noorulain",
    full_name: "Noor-ul-Ain",
    headline: "Fashion Photographer",
    company: "Studio Noor",
    bio: "Lookbooks and campaigns. Shot for Khaadi, Sapphire and Generation.",
    location: "Lahore",
    links: [
      ["Instagram", "instagram", "https://instagram.com/example"],
      ["Rate card", "link", "https://example.pk/rates"],
      ["WhatsApp", "whatsapp", wa("0017")],
    ],
    captions: ["Lawn '25 campaign", "Bridal editorial", "Studio test", "Rooftop series"],
  }),

  // ---------------- Sectioned ----------------
  stack: person({
    n: "0018",
    username: "kamran",
    full_name: "Kamran Sethi",
    headline: "Marketing Consultant",
    company: "Independent",
    bio: "I help Pakistani D2C brands stop burning money on ads that don't convert. Twelve years, mostly in retail and FMCG.",
    location: "Islamabad",
    links: [
      ["Book a session", "link", "https://example.pk/book"],
      ["Case studies", "link", "https://example.pk/work"],
      ["LinkedIn", "linkedin", "https://linkedin.com/in/example"],
      ["Email", "email", "kamran@example.pk"],
    ],
  }),

  agency: person({
    n: "0019",
    username: "chenab",
    full_name: "Studio Chenab",
    headline: "Brand & Digital",
    company: "Est. 2016",
    bio: "A twelve-person studio in Lahore. Identity, packaging and websites for brands that ship.",
    location: "Lahore",
    links: [
      ["Branding", "link", "https://example.pk/branding"],
      ["Packaging", "link", "https://example.pk/packaging"],
      ["Web & product", "link", "https://example.pk/web"],
      ["Start a project", "whatsapp", wa("0019")],
    ],
    captions: ["Tapal rebrand", "Shan packaging", "Bykea campaign", "Sapphire site"],
  }),

  // ---------------- Form ----------------
  reply: person({
    n: "0020",
    username: "mehwish",
    full_name: "Mehwish Iqbal",
    headline: "Career Coach",
    company: "Rise Careers",
    bio: "CV reviews and interview prep for people moving into tech. First session free.",
    location: "Karachi",
    links: [
      ["LinkedIn", "linkedin", "https://linkedin.com/in/example"],
      ["Success stories", "link", "https://example.pk/stories"],
      ["WhatsApp", "whatsapp", wa("0020")],
    ],
  }),

  booking: person({
    n: "0021",
    username: "drfaisal",
    full_name: "Dr. Faisal Nadeem",
    headline: "Dentist — BDS, MFDS",
    company: "Smile Dental, Saddar",
    bio: "Scaling, fillings, root canals. Same-week appointments, card accepted.",
    location: "Rawalpindi",
    links: [
      ["WhatsApp", "whatsapp", wa("0021")],
      ["Call clinic", "phone", tel("0021")],
      ["Directions", "link", "https://example.pk/map"],
    ],
  }),
};

export const FALLBACK_PERSONA = DEMO_PERSONAS.minimal;
