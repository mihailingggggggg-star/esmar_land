"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { useFunnel } from "@/components/funnel-context";
import { cn } from "@/lib/utils";

/**
 * Mobile sticky CTA — appears once the amount section scrolls out of view,
 * so the primary action is always one thumb-tap away.
 */
export function StickyCta({ dict }: { dict: Dictionary }) {
  const { tier, submit, submitting } = useFunnel();
  const [visible, setVisible] = React.useState(false);

  const [footerVisible, setFooterVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const target = document.getElementById("amount");
    const footer = document.getElementById("site-footer");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && window.scrollY > 300),
      { rootMargin: "-40px 0px 0px 0px", threshold: 0.2 },
    );
    observer.observe(target);

    let footerObserver: IntersectionObserver | undefined;
    if (footer) {
      footerObserver = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), {
        threshold: 0.05,
      });
      footerObserver.observe(footer);
    }

    return () => {
      observer.disconnect();
      footerObserver?.disconnect();
    };
  }, []);

  const option = dict.amounts.options.find((o) => o.id === tier);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-500 md:hidden",
        visible && !footerVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <div className="glass-strong flex items-center gap-3 rounded-[20px] p-2 pl-4 shadow-[0_-10px_40px_-20px_rgba(9,46,34,0.5)]">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            {option ? dict.amounts.selectedLabel : dict.amounts.legend}
          </p>
          <p className="truncate text-[14px] font-semibold text-ink">
            {option ? option.range : "100 – 5 000 $ +"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className="flex h-11 items-center gap-1.5 rounded-[14px] bg-primary px-4 text-[14px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(15,59,44,0.9)] transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {dict.amounts.cta}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
