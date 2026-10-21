import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, localeMeta, locales, type Locale } from "@/i18n";
import { Analytics } from "@/components/analytics";
import { FunnelProvider } from "@/components/funnel-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickyCta } from "@/components/sticky-cta";
import { site } from "@/data/site";

type Params = { locale: string };

export function generateStaticParams(): Params[] {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const base = process.env.PUBLIC_BASE_URL || "https://esmar.kg";

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    keywords: dict.meta.keywords,
    alternates: {
      canonical: `${base}/${locale}`,
      languages: {
        ru: `${base}/ru`,
        ky: `${base}/ky`,
        "x-default": `${base}/ru`,
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: `${base}/${locale}`,
      siteName: "Esmar",
      locale: localeMeta[locale].ogLocale,
      type: "website",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: dict.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
      images: ["/og.jpg"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.parentSite}#organization`,
        name: "Esmar",
        url: site.parentSite,
        logo: `${site.parentSite}/logo.svg`,
        telephone: site.phone,
        email: site.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "ул. Исы Ахунбаева, 169, БЦ Binokl, 7 этаж",
          addressLocality: "Бишкек",
          addressCountry: "KG",
        },
        sameAs: [site.instagram, site.facebook],
      },
      {
        "@type": "FAQPage",
        mainEntity: dict.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <FunnelProvider locale={locale} dict={dict}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Analytics pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} locale={locale} />
      {process.env.NEXT_PUBLIC_META_PIXEL_ID ? (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      ) : null}
      <SiteHeader locale={locale} dict={dict} />
      <main id="content" className="pb-6">
        {children}
      </main>
      <SiteFooter dict={dict} />
      <StickyCta dict={dict} />
    </FunnelProvider>
  );
}
