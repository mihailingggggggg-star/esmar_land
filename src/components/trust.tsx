import { BadgeCheck, FileSignature, TrendingUp, Building2 } from "lucide-react";
import type { Dictionary } from "@/i18n/types";

const ICONS = [BadgeCheck, FileSignature, Building2, TrendingUp];

export function Trust({ dict }: { dict: Dictionary }) {
  return (
    <section className="px-5 pt-8 lg:px-8 lg:pt-16" aria-label={dict.trust.title}>
      <div className="mx-auto max-w-md lg:max-w-6xl">
        <div className="glass-strong rounded-[26px] p-4 lg:rounded-[30px] lg:p-7">
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-0">
            {dict.trust.items.map((item, index) => {
              const Icon = ICONS[index] ?? BadgeCheck;
              return (
                <div key={item.title} className="flex gap-2.5 lg:gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[11px] bg-primary/[0.07] text-primary lg:size-10 lg:rounded-[13px]">
                    <Icon className="size-[15px] lg:size-[18px]" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold leading-tight text-ink lg:text-[13.5px]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[10.5px] leading-snug text-muted lg:mt-1 lg:text-[11.5px]">
                      {item.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-primary/10 border-t border-primary/10 pt-3.5 lg:mt-6 lg:pt-5">
            {dict.trust.stats.map((stat) => (
              <div key={stat.label} className="px-1 text-center">
                <p className="font-display text-[17px] font-semibold leading-tight text-primary lg:text-[26px]">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[9.5px] leading-tight text-muted lg:text-[11.5px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
