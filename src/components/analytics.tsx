"use client";

import { useEffect } from "react";
import {
  captureAttribution,
  initPixel,
  pageViewId,
  pixelTrack,
  serverTrack,
} from "@/lib/analytics/client";

type Props = {
  pixelId?: string;
  locale: string;
};

/**
 * Runs once per page load:
 * 1. captures first/last-touch attribution into first-party storage
 * 2. initialises the Meta Pixel (if configured)
 * 3. sends PageView to both the browser pixel and the Conversions API with one event_id
 */
export function Analytics({ pixelId, locale }: Props) {
  useEffect(() => {
    const attribution = captureAttribution(locale);

    if (pixelId) {
      initPixel(pixelId);
      pixelTrack("PageView", { locale }, pageViewId());
    }

    void serverTrack({
      name: "PageView",
      eventId: pageViewId(),
      locale,
      attribution,
      params: { locale },
    });
  }, [pixelId, locale]);

  return null;
}
