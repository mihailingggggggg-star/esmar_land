import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { LangSwitch } from "@/components/lang-switch";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-50 px-3 pt-2.5">
      <div className="glass mx-auto flex max-w-md items-center justify-between gap-2 rounded-full px-3 py-2 lg:max-w-6xl lg:px-5 lg:py-2.5">
        <a href={`/${locale}`} aria-label="Esmar" className="flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/esmar-logo.svg"
            alt="Esmar"
            width={118}
            height={30}
            className="h-[27px] w-auto lg:h-[30px]"
          />
        </a>

        <div className="flex items-center gap-1.5">
          <span className="hidden select-none text-[10px] font-medium text-muted sm:inline">
            {dict.header.license}
          </span>
          <LangSwitch locale={locale} />
        </div>
      </div>
    </header>
  );
}
