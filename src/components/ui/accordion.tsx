"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "glass overflow-hidden rounded-[20px] transition-colors data-[state=open]:bg-white/80",
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 px-4 py-4 text-left text-[15px] font-semibold leading-snug text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          className,
        )}
        {...props}
      >
        {children}
        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/15 bg-white/70 text-primary transition-transform duration-300 group-data-[state=open]:rotate-45">
          <Plus className="size-3.5" strokeWidth={2.2} />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <div className="px-4 pb-4 pt-0 text-[13.5px] leading-relaxed text-muted">{children}</div>
    </AccordionPrimitive.Content>
  );
}
