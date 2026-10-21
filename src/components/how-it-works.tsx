import type { Dictionary } from "@/i18n/types";

export function HowItWorks({ dict }: { dict: Dictionary }) {
  return (
    <section className="px-5 pt-9 lg:px-8 lg:pt-16">
      <div className="mx-auto max-w-md lg:max-w-5xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-bronze lg:text-[11px]">
          {dict.how.eyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink lg:mt-2 lg:text-[30px]">
          {dict.how.title}
        </h2>

        <ol className="relative mt-4 space-y-3 lg:mt-7 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
          <span className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-bronze/40 via-primary/15 to-transparent lg:hidden" />
          {dict.how.steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-3.5 lg:block">
              <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-bronze/25 bg-white/85 font-display text-[13px] font-semibold text-bronze backdrop-blur lg:mb-3 lg:size-9 lg:text-[14px]">
                {index + 1}
              </span>
              <div className="glass flex-1 rounded-[18px] px-3.5 py-3 lg:rounded-[22px] lg:px-5 lg:py-5">
                <p className="text-[13.5px] font-semibold leading-snug text-ink lg:text-[15px]">
                  {step.title}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted lg:mt-1.5 lg:text-[12.5px] lg:leading-relaxed">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
