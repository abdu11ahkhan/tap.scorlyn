import Link from "next/link";
import BrandLockup from "@/components/layout/BrandLockup";

/** Same frame as /login, so the password reset pages read as part of sign-in. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink p-4">
      <div className="float-orb pointer-events-none absolute -left-32 top-0 h-[460px] w-[460px] rounded-full bg-acid/20 blur-[130px]" />
      <div className="float-orb pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-hotpink/20 blur-[130px]" />
      <Link href="/" className="absolute left-6 top-6 flex items-center">
        <BrandLockup width={170} />
      </Link>
      <div
        className="sticker-lg relative z-10 w-full max-w-md rounded-[2rem] border-2 border-ink bg-white p-8"
        style={{ ["--sticker-color" as string]: "#F58800" }}
      >
        {children}
      </div>
    </div>
  );
}
