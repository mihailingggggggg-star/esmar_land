"use client";

import type { Locale } from "@/i18n/config";
import { localeLabels } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LangSwitch({ locale }: { locale: Locale }) {
  const options: Locale[] = ["ru", "ky"];

  return (
    <div className="relative flex items-center rounded-full border border-primary/10 bg-white/55 p-0.5 backdrop-blur-md">
      {options.map((option) => {
        const active = option === locale;
        return (
          <a
            key={option}
            href={`/${option}`}
            hrefLang={option}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              document.cookie = `esm_locale=${option}; Path=/; Max-Age=31536000; SameSite=Lax`;
            }}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-300",
              active
                ? "bg-primary text-white shadow-[0_6px_14px_-8px_rgba(15,59,44,0.9)]"
                : "text-muted hover:text-primary",
            )}
          >
            {localeLabels[option].short}
          </a>
        );
      })}
    </div>
  );
}
