"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-tight text-white print:hidden"
    >
      <Printer className="h-4 w-4" />
      print / save as pdf
    </button>
  );
}
