"use client";

import * as React from "react";
import { ArrowRight, Check, Loader2, Lock } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { useFunnel } from "@/components/funnel-context";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

type Props = {
  dict: Dictionary;
};

export function AmountPicker({ dict }: Props) {
  const { tier, selectTier, submit, submitting, highlight, formRef } = useFunnel();

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const options = dict.amounts.options;
    const currentIndex = options.findIndex((o) => o.id === tier);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      selectTier(options[(currentIndex + 1) % options.length].id);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectTier(options[(currentIndex - 1 + options.length) % options.length].id);
    }
  };

  return (
    <section id="amount" ref={formRef} className="scroll-mt-24 px-5 pt-6 lg:px-0 lg:pt-8">
      <div className="mx-auto max-w-md lg:max-w-none">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-bronze">
              {dict.amounts.legend}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted">{dict.amounts.caption}</p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label={dict.amounts.legend}
          onKeyDown={onKeyDown}
          className="mt-3.5 space-y-2.5"
        >
          {dict.amounts.options.map((option, index) => {
            const selected = tier === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected || (!tier && index === 0) ? 0 : -1}
                onClick={() => selectTier(option.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3.5 overflow-hidden rounded-[20px] px-4 py-3.5 text-left transition-all duration-300",
                  "glass hover:bg-white/75",
                  selected
                    ? "bg-white/85 shadow-[0_22px_45px_-26px_rgba(9,46,34,0.55)] ring-1 ring-primary/35"
                    : "ring-1 ring-transparent",
                  highlight && !selected && "animate-[nudge_0.7s_ease-in-out_2]",
                )}
              >
                {selected && (
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-bronze via-bronze to-bronze/40" />
                )}

                <span
                  className={cn(
                    "check-dot grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px]",
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-primary/25 bg-white/40 text-transparent group-hover:border-primary/40",
                  )}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[18px] font-semibold tracking-[-0.01em] text-ink lg:text-[17px]">
                      {option.range}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-[0.1em] transition-colors",
                        selected ? "bg-bronze/12 text-bronze" : "bg-primary/5 text-muted",
                      )}
                    >
                      {option.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className={cn(
            "relative mt-4 flex h-[57px] w-full items-center justify-center gap-2 overflow-hidden rounded-[19px] text-[16.5px] font-semibold text-white transition-all duration-300 lg:mt-5",
            "bg-primary shadow-[0_24px_45px_-22px_rgba(15,59,44,0.85)]",
            "hover:bg-primary-soft active:scale-[0.99] disabled:opacity-80",
          )}
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_15%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {dict.amounts.submitting}
            </>
          ) : (
            <>
              {dict.amounts.cta}
              <ArrowRight className="size-[18px] transition-transform duration-300 group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-muted">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-green" />
          </span>
          {dict.amounts.ctaHint}
        </p>

        <p className="mx-auto mt-3 max-w-[330px] text-center text-[10px] leading-relaxed text-muted/85">
          {dict.amounts.privacyPrefix}{" "}
          <a
            href={site.privacy}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-primary/25 underline-offset-2 transition-colors hover:text-primary"
          >
            {dict.amounts.privacyLink}
          </a>
          {dict.amounts.privacySuffix}
        </p>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted/70">
          <Lock className="size-2.5" />
          {site.licenseNumber} · {dict.header.license}
        </p>
      </div>
    </section>
  );
}
