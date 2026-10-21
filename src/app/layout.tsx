import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { isLocale, localeCookie } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_BASE_URL || "https://esmar.kg"),
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  formatDetection: { telephone: true, email: true, address: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fbfcfe",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const fromHeader = headerStore.get("x-esm-locale");
  const fromCookie = cookieStore.get(localeCookie)?.value;
  const lang = isLocale(fromHeader) ? fromHeader : isLocale(fromCookie) ? fromCookie : "ru";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <div className="aura" aria-hidden />
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
