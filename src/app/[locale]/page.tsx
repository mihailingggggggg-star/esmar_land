import { notFound } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { getDictionary, isLocale } from "@/i18n";
import { ObjectDrum } from "@/components/object-drum";
import { AmountPicker } from "@/components/amount-picker";
import { Trust } from "@/components/trust";
import { HowItWorks } from "@/components/how-it-works";
import { Faq } from "@/components/faq";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <section className="px-5 pt-4 lg:px-8 lg:pt-10" aria-labelledby="hero-title">
        <div className="mx-auto grid max-w-md gap-0 lg:max-w-6xl lg:grid-cols-[minmax(0,470px)_minmax(0,1fr)] lg:gap-x-16 lg:gap-y-0">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-[0_8px_20px_-16px_rgba(9,46,34,0.8)] backdrop-blur">
                <ShieldCheck className="size-3 text-green" strokeWidth={2.2} />
                {dict.hero.badge}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-bronze">
                <Sparkles className="size-3" strokeWidth={2.2} />
                55% {dict.trust.stats[0].label}
              </span>
            </div>

            <h1
              id="hero-title"
              className="mt-2.5 text-balance font-display text-[26px] font-semibold leading-[1.11] tracking-[-0.022em] text-ink xs:text-[28px] lg:mt-5 lg:text-[44px] lg:leading-[1.06] lg:tracking-[-0.028em]"
            >
              {dict.hero.titleTop}
              <span className="mt-1 block text-[15.5px] font-medium leading-snug tracking-[-0.01em] text-primary/55 lg:mt-2.5 lg:text-[21px]">
                {dict.hero.titleAccent}
              </span>
            </h1>

            <p className="mt-2 max-w-[330px] text-[12.5px] leading-relaxed text-muted lg:mt-5 lg:max-w-[420px] lg:text-[15px] lg:leading-relaxed">
              {dict.hero.subtitle}
            </p>
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <ObjectDrum locale={locale} dict={dict} />
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <AmountPicker dict={dict} />
          </div>
        </div>
      </section>

      <Trust dict={dict} />
      <HowItWorks dict={dict} />
      <Faq dict={dict} />
    </>
  );
}
