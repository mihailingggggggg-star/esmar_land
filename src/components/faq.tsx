import type { Dictionary } from "@/i18n/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Faq({ dict }: { dict: Dictionary }) {
  return (
    <section className="px-5 pt-9 lg:px-8 lg:pt-16" aria-labelledby="faq-title">
      <div className="mx-auto max-w-md lg:max-w-6xl">
        <div className="lg:max-w-3xl">
        <h2
          id="faq-title"
          className="font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink lg:text-[30px]"
        >
          {dict.faq.title}
        </h2>
        <Accordion type="single" collapsible className="mt-3.5 space-y-2 lg:mt-5">
          {dict.faq.items.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`}>
              <AccordionTrigger className="lg:text-[15.5px]">{item.q}</AccordionTrigger>
              <AccordionContent className="lg:text-[14px]">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        </div>
      </div>
    </section>
  );
}
