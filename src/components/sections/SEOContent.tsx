import React from "react";

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
    answer: "Creating your digital profile and using our online tools is completely free (Rs. 0 forever). If you want the physical NFC business card to tap and share, our premium cards start at just Rs. 1,600 as a one-time purchase, with no recurring subscription fees.",
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
    <section className="bg-paper py-24 text-ink border-t border-line">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-[clamp(2.4rem,6vw,4rem)] font-black leading-[0.95] tracking-[-0.04em] text-ink">
            frequently asked <span className="text-teal">questions.</span>
          </h2>
        </div>
        
        <dl className="grid gap-10 md:grid-cols-2">
          {FAQ_DATA.map((faq, index) => (
            <div key={index} className="space-y-3">
              <dt className="text-lg font-black uppercase tracking-tight text-ink">
                {faq.question}
              </dt>
              <dd className="text-[15px] font-medium leading-relaxed text-ink-dim">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
