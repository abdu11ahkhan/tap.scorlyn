"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

/**
 * Email us — with a fallback for machines that have no mail client.
 *
 * A bare `mailto:` link does nothing at all on a desktop with no default
 * handler registered, which is the common case on Windows. The click looks
 * broken and the visitor has no way to get the address. So the address is
 * copied to the clipboard first, then the mail app is attempted: if it opens,
 * the copy was harmless; if it doesn't, they still have the address.
 */
export default function EmailAction({
  email,
  subject,
  className = "",
  children,
}: {
  email: string;
  subject: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const go = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard needs a secure context and can be refused outright. The
      // mail app is still worth trying.
    }
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  return (
    <button type="button" onClick={go} className={className} aria-label={`Email ${email}`}>
      {copied ? <Check className="h-5 w-5 shrink-0" /> : <Mail className="h-5 w-5 shrink-0" />}
      <span className="min-w-0 truncate text-left">{copied ? "Address copied" : children}</span>
    </button>
  );
}
