"use client";

import * as React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Keyboard, A11y } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import { ArrowRight, Pause, Play } from "lucide-react";
import { objects } from "@/data/objects";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { captureAttribution, pageViewId, pixelTrack, serverTrack } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/effect-coverflow";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

const CATEGORY_STYLES: Record<string, string> = {
  rent: "bg-white/80 text-primary",
  development: "bg-beige/90 text-[#7a4b1c]",
  partnership: "bg-primary/90 text-white",
};

export function ObjectDrum({ locale, dict }: Props) {
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const swiperRef = React.useRef<SwiperInstance | null>(null);
  const tracked = React.useRef(false);

  // render two passes so the loop never runs out of slides
  const slides = React.useMemo(
    () =>
      [...objects, ...objects].map((item, index) => ({
        item,
        key: `${item.id}-${index}`,
        duplicate: index >= objects.length,
      })),
    [],
  );

  // respect reduced-motion: no auto-rotation for users who asked for stillness
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPaused(true);
      swiperRef.current?.autoplay?.stop();
    }
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setPaused(true);
        swiperRef.current?.autoplay?.stop();
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    const id = `${pageViewId()}-vc`;
    pixelTrack("ViewContent", {
      content_type: "product",
      content_ids: objects.map((o) => o.id),
      content_category: "real_estate_investment",
    });
    void serverTrack({
      name: "ViewContent",
      eventId: id,
      locale,
      attribution: captureAttribution(locale),
      params: { content_type: "product", content_ids: objects.map((o) => o.id) },
    });
  }, [locale]);

  const goTo = (index: number) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    swiper.slideToLoop(index, 900);
  };

  return (
    <section aria-labelledby="objects-title" className="relative mt-5 lg:mt-0">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-bronze lg:text-[11px]">
            {dict.hero.objectsLabel}
          </p>
          <h2 id="objects-title" className="sr-only">
            {dict.hero.objectsLabel}
          </h2>
        </div>
        <span className="hidden items-center gap-1.5 text-[10.5px] font-medium text-muted sm:flex">
          {dict.hero.swipeHint}
          <ArrowRight className="size-3" />
        </span>
      </div>

      <div className="drum relative -mx-5 mt-2.5 overflow-hidden pb-1 lg:mx-0 lg:mt-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-bg via-bg/70 to-transparent" />

        <Swiper
          modules={[Autoplay, EffectCoverflow, Keyboard, A11y]}
          onSwiper={(instance) => {
            swiperRef.current = instance;
            setReady(true);
          }}
          onSlideChange={(instance) => setActive(instance.realIndex % objects.length)}
          effect="coverflow"
          coverflowEffect={{ rotate: 22, stretch: 0, depth: 240, modifier: 1.05, slideShadows: false }}
          slidesPerView="auto"
          centeredSlides
          loop
          speed={950}
          grabCursor
          keyboard={{ enabled: true }}
          a11y={{ enabled: true, prevSlideMessage: "←", nextSlideMessage: "→" }}
          autoplay={{
            delay: 2000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            reverseDirection: true,
            waitForTransition: false,
          }}
          className={cn("!px-0", ready ? "opacity-100" : "opacity-0", "transition-opacity duration-500")}
        >
          {slides.map(({ item, key, duplicate }, index) => (
            <SwiperSlide key={key} aria-hidden={duplicate}>
              <article
                className="object-card glass-strong sheen relative overflow-hidden rounded-[26px]"
                data-category={item.category}
              >
                <div className="relative aspect-[16/10.6] w-full overflow-hidden rounded-t-[26px]">
                  <img
                    src={`${item.image}-1200.jpg`}
                    srcSet={`${item.image}-640.jpg 640w, ${item.image}-1200.jpg 1200w`}
                    sizes="(max-width: 768px) 78vw, 340px"
                    alt={item.alt[locale]}
                    width={1200}
                    height={946}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                    className="h-full w-full scale-[1.02] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081b14]/78 via-[#081b14]/10 to-transparent" />

                  <span
                    className={cn(
                      "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] backdrop-blur-md",
                      CATEGORY_STYLES[item.category],
                    )}
                  >
                    {dict.categories[item.category]}
                  </span>

                  <div className="absolute right-2.5 top-2.5 rounded-xl border border-white/70 bg-white/88 px-2.5 py-1 text-right shadow-[0_10px_25px_-14px_rgba(8,27,20,0.8)] backdrop-blur-xl">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {dict.objectCard.yield}
                    </p>
                    <p className="text-[17px] font-bold leading-tight text-primary">
                      {item.yieldLabel[locale]}
                    </p>
                    <p className="-mt-1 text-[8px] font-medium text-muted">
                      {dict.objectCard.perYear}
                    </p>
                  </div>

                  <div className="absolute inset-x-3.5 bottom-3">
                    <h3 className="text-[18px] font-semibold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                      {item.title[locale]}
                    </h3>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11.5px] font-medium text-white/85">
                      <span className="shrink-0 whitespace-nowrap">{item.area[locale]}</span>
                      <span className="size-0.5 shrink-0 rounded-full bg-white/60" />
                      <span className="truncate">{item.location[locale]}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-2 bg-white/55 px-3.5 py-2.5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {dict.objectCard.format}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold leading-tight text-ink">
                      {item.status[locale]}
                    </p>
                  </div>
                  <div className="border-l border-primary/10 pl-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {item.deadline ? dict.objectCard.deadline : dict.objectCard.payments}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold leading-tight text-ink">
                      {item.deadline ? item.deadline[locale] : item.payments[locale]}
                    </p>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5" role="group" aria-label={dict.hero.objectsLabel}>
          {objects.map((item, index) => {
            const isActive = active === index;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "true" : undefined}
                aria-label={item.title[locale]}
                onClick={() => goTo(index)}
                className={cn(
                  "relative h-1.5 overflow-hidden rounded-full transition-all duration-500",
                  isActive ? "w-8 bg-primary/15" : "w-1.5 bg-primary/20 hover:bg-primary/35",
                )}
              >
                {isActive && (
                  <span
                    key={`${index}-${paused}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-bronze"
                    style={{
                      animation: "drum-progress 2s linear forwards",
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setPaused((value) => {
              const swiper = swiperRef.current;
              if (swiper?.autoplay) {
                if (value) swiper.autoplay.start();
                else swiper.autoplay.stop();
              }
              return !value;
            });
          }}
          className="flex items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-medium text-muted transition-colors hover:text-primary"
          aria-label={paused ? dict.hero.play : dict.hero.pause}
        >
          {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
          <span className="hidden sm:inline">{paused ? dict.hero.play : dict.hero.pause}</span>
        </button>
      </div>
    </section>
  );
}
