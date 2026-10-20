import Link from "next/link";
import { ChevronDown } from "lucide-react";
import PosterTitle from "./PosterTitle";

const FAQ_DATA = [
  {
    question: "What is an NFC card?",
    answer: "An NFC card uses near-field communication technology to transmit data wirelessly. Instead of handing out paper cards that get lost, you simply tap your NFC business card against a smartphone, and your complete digital profile instantly opens on their screen.",
  },
  {
    question: "How does an NFC digital business card work?",
    answer: "When you tap your digital NFC card against the back of a compatible smartphone, a notification appears on the screen. Tapping that notification instantly loads your ScorlynTap profile containing your contact details, social links, and portfolio—no app required.",
  },
  {
    question: "Do you deliver across Pakistan?",
    answer: "Yes. We offer fast, nationwide shipping. Whether you are networking in Lahore, attending corporate events in Karachi, or managing a business in Islamabad, we deliver premium NFC cards directly to your door anywhere in Pakistan.",
  },
  {
    question: "How much does an NFC business card cost in Pakistan?",
    answer: "Creating your digital profile and using our online tools is completely free (Rs. 0 forever). If you want the physical NFC business card to tap and share, our cards start at Rs. 2,200 as a one-time purchase, with no recurring subscription fees.",
  },
  {
    question: "What's the difference between a regular business card and a digital NFC card?",
    answer: "A regular card holds limited information and needs to be reprinted every time your details change. A digital NFC card is dynamic—you can update your phone number, email, or links online at any time without ever ordering new cards.",
  },
];

export function SEOContent() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="relative border-b-[3px] border-char bg-cream py-14 text-char sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-10 text-center sm:mb-16">
          <PosterTitle lead="Frequently asked" accent="questions" variant="outline" align="center" />
        </div>

        {/* Collapsed by default: all five answers were previously shown open
            at once, adding well over a thousand px to every visit even
            though most visitors only want one or two of them. Native
            <details>, so the full text stays in the page (and in the
            FAQPage schema above) and works without JavaScript — same pattern
            as the payment drawer on a public card page. */}
        <div className="grid gap-4 md:grid-cols-2">
          {FAQ_DATA.map((faq, index) => (
            <details key={index} className="brut-sm group rounded-3xl bg-white p-5 sm:p-6">
              <summary className="display flex cursor-pointer list-none items-center justify-between gap-3 text-[19px] text-char sm:text-[26px] [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-char/50 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-[14px] font-semibold leading-relaxed text-char/75 sm:text-[15px]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-bold text-char/60">
          <Link href="/faq" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
            See all questions
          </Link>
        </p>
      </div>
    </section>
  );
}
