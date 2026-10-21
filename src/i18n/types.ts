export type AmountTierId = "s1" | "s2" | "s3";

export type AmountOption = {
  id: AmountTierId;
  /** value sent to CRM / Meta custom_data */
  value: number;
  range: string;
  name: string;
  hint: string;
};

export type Dictionary = {
  meta: {
    title: string;
    description: string;
    ogAlt: string;
    keywords: string;
  };
  header: {
    license: string;
    call: string;
  };
  hero: {
    badge: string;
    titleTop: string;
    titleAccent: string;
    subtitle: string;
    objectsLabel: string;
    swipeHint: string;
    pause: string;
    play: string;
    slideLabel: string;
  };
  amounts: {
    legend: string;
    caption: string;
    options: AmountOption[];
    cta: string;
    ctaHint: string;
    privacyPrefix: string;
    privacyLink: string;
    privacySuffix: string;
    selectedLabel: string;
    error: string;
    submitting: string;
  };
  trust: {
    title: string;
    items: { title: string; sub: string }[];
    stats: { value: string; label: string }[];
  };
  objectCard: {
    yield: string;
    perYear: string;
    location: string;
    format: string;
    deadline: string;
    payments: string;
    area: string;
  };
  categories: {
    rent: string;
    development: string;
    partnership: string;
  };
  how: {
    eyebrow: string;
    title: string;
    steps: { title: string; text: string }[];
  };
  faq: {
    title: string;
    items: { q: string; a: string }[];
  };
  footer: {
    tagline: string;
    disclaimer: string;
    license: string;
    company: string;
    contactsTitle: string;
    phoneLabel: string;
    addressLabel: string;
    address: string;
    hoursLabel: string;
    hours: string;
    privacy: string;
    rights: string;
    social: string;
  };
  whatsapp: {
    templates: Record<AmountTierId, string>;
    defaultTemplate: string;
  };
};

export type Localized = { ru: string; ky: string };
