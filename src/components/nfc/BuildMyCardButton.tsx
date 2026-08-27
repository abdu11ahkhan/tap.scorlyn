"use client";

import { useState } from "react";
import StartChooserModal from "./StartChooserModal";

/**
 * The closing CTA's trigger, split into its own client component so the
 * homepage around it can stay a server component.
 */
export default function BuildMyCardButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        build my card
      </button>
      <StartChooserModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
