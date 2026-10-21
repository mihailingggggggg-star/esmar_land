import { MapPin, Phone, Clock, Mail } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { site } from "@/data/site";

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer id="site-footer" className="mt-9 rounded-t-[30px] bg-primary px-5 pb-8 pt-7 text-white/85 lg:mt-16 lg:px-8 lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-md lg:max-w-6xl">
        <div className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/esmar-logo-white.svg"
                  alt="Esmar"
                  width={126}
                  height={32}
                  className="h-7 w-auto opacity-95 lg:h-8"
                />
                <p className="mt-2 max-w-[220px] text-[11px] leading-snug text-white/60 lg:mt-3 lg:text-[12.5px]">
                  {dict.footer.tagline}.
                </p>
              </div>
              <div className="flex gap-2 lg:hidden">
                <SocialLinks />
              </div>
            </div>

            <div className="mt-5 space-y-2.5 text-[12px] lg:mt-6 lg:space-y-3 lg:text-[13px]">
              <a href={`tel:${site.phone}`} className="flex items-center gap-2.5 hover:text-white">
                <Phone className="size-3.5 shrink-0 text-white/50" />
                {site.phoneDisplay}
              </a>
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-2.5 hover:text-white"
              >
                <Mail className="size-3.5 shrink-0 text-white/50" />
                {site.email}
              </a>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-white/50" />
                <span className="leading-snug text-white/70">{dict.footer.address}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="size-3.5 shrink-0 text-white/50" />
                <span className="text-white/70">{dict.footer.hours}</span>
              </p>
            </div>
            <div className="mt-4 hidden gap-2 lg:flex">
              <SocialLinks />
            </div>
          </div>

          <div className="mt-5 border-t border-white/12 pt-4 lg:mt-0 lg:border-t-0 lg:pt-0">
            <p className="text-[10px] leading-relaxed text-white/50 lg:text-[11px]">
              {dict.footer.disclaimer}
            </p>
            <p className="mt-2.5 text-[10px] leading-relaxed text-white/50 lg:mt-3 lg:text-[11px]">
              {dict.footer.license}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/55 lg:text-[11px]">
              <a
                href={site.privacy}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-white/25 underline-offset-2 hover:text-white"
              >
                {dict.footer.privacy}
              </a>
              <span className="text-white/25">·</span>
              <a
                href={site.parentSite}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-white/25 underline-offset-2 hover:text-white"
              >
                esmar.kg
              </a>
              <span className="text-white/25">·</span>
              <a
                href={site.telegram}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-white/25 underline-offset-2 hover:text-white"
              >
                Telegram
              </a>
            </div>
            <p className="mt-3 text-[10px] text-white/35 lg:text-[11px]">
              © {new Date().getFullYear()} {dict.footer.company}. {dict.footer.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLinks() {
  return (
    <>
      <a
        href={site.instagram}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Instagram"
        className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] transition-colors hover:bg-white/15"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      </a>
      <a
        href={site.facebook}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Facebook"
        className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/[0.06] transition-colors hover:bg-white/15"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
          <path d="M13.5 21v-7.2h2.6l.4-3h-3V8.9c0-.87.24-1.46 1.49-1.46h1.59V4.75c-.28-.04-1.22-.12-2.32-.12-2.3 0-3.87 1.4-3.87 3.98v2.19H7.8v3h2.59V21h3.11Z" />
        </svg>
      </a>
    </>
  );
}
