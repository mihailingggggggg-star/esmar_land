"use client";

import * as React from "react";
import type { AmountTierId } from "@/i18n/types";
import type { Dictionary } from "@/i18n/types";
import { captureAttribution, pixelTrack } from "@/lib/analytics/client";
import { whatsappLink } from "@/data/site";

type FunnelContextValue = {
  tier: AmountTierId | null;
  selectTier: (tier: AmountTierId) => void;
  submit: () => Promise<void>;
  submitting: boolean;
  highlight: boolean;
  formRef: React.RefObject<HTMLDivElement | null>;
};

const FunnelContext = React.createContext<FunnelContextValue | null>(null);

export function useFunnel(): FunnelContextValue {
  const ctx = React.useContext(FunnelContext);
  if (!ctx) throw new Error("useFunnel must be used inside <FunnelProvider>");
  return ctx;
}

type Props = {
  locale: string;
  dict: Dictionary;
  children: React.ReactNode;
};

export function FunnelProvider({ locale, dict, children }: Props) {
  const [tier, setTier] = React.useState<AmountTierId | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [highlight, setHighlight] = React.useState(false);
  const formRef = React.useRef<HTMLDivElement | null>(null);

  const selectTier = React.useCallback(
    (next: AmountTierId) => {
      setTier(next);
      setHighlight(false);
      const option = dict.amounts.options.find((o) => o.id === next);
      if (!option) return;
      pixelTrack(
        "SelectAmount",
        {
          content_ids: [next],
          content_name: option.range,
          currency: "USD",
          value: option.value,
          locale,
        },
        undefined,
        true,
      );
    },
    [dict, locale],
  );

  const submit = React.useCallback(async () => {
    if (submitting) return;

    if (!tier) {
      setHighlight(true);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => setHighlight(false), 2600);
      return;
    }

    setSubmitting(true);
    const option = dict.amounts.options.find((o) => o.id === tier);
    const attribution = captureAttribution(locale);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);

    const fallback = () => {
      pixelTrack("Contact", {
        content_name: option?.range,
        currency: "USD",
        value: option?.value,
      });
      window.location.href = whatsappLink(dict.whatsapp.defaultTemplate);
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        signal: controller.signal,
        body: JSON.stringify({
          amount_tier: tier,
          locale,
          attribution,
          page_variant: "drum_v1",
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; event_id?: string; whatsapp_url?: string; amount?: { value: number; label: string } }
        | null;

      if (data?.ok && data.whatsapp_url) {
        try {
          sessionStorage.setItem("esm_last_lead", JSON.stringify({ id: data.event_id, at: Date.now() }));
        } catch {
          /* ignore */
        }
        pixelTrack(
          "Contact",
          {
            content_name: data.amount?.label ?? option?.range,
            currency: "USD",
            value: data.amount?.value ?? option?.value,
          },
          data.event_id,
        );
        window.location.href = data.whatsapp_url;
        return;
      }
      fallback();
    } catch {
      fallback();
    } finally {
      window.clearTimeout(timeout);
      window.setTimeout(() => setSubmitting(false), 1200);
    }
  }, [dict, locale, submitting, tier]);

  const value = React.useMemo(
    () => ({ tier, selectTier, submit, submitting, highlight, formRef }),
    [tier, selectTier, submit, submitting, highlight],
  );

  return <FunnelContext.Provider value={value}>{children}</FunnelContext.Provider>;
}
