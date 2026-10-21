import type { Localized } from "@/i18n/types";

export type ObjectCategory = "rent" | "development" | "partnership";

export type PropertyObject = {
  id: string;
  category: ObjectCategory;
  /** base path, images exist as `${image}-640.jpg` and `${image}-1200.jpg` */
  image: string;
  alt: Localized;
  title: Localized;
  area: Localized;
  location: Localized;
  yieldLabel: Localized;
  deadline?: Localized;
  payments: Localized;
  status: Localized;
};

/**
 * Objects are taken 1:1 from the esmar.kg catalogue (home + /katalog):
 * ТЦ Манас, ЖК Анкара I, Шералиева 286 — names, areas, addresses,
 * handover quarters and program yields are unchanged.
 */
export const objects: PropertyObject[] = [
  {
    id: "manas",
    category: "rent",
    image: "/objects/manas",
    alt: {
      ru: "ТЦ Манас — коммерческая недвижимость на проспекте Айтматова в Бишкеке",
      ky: "Манас соода борбору — Бишкектеги Айтматов проспектиндеги коммерциялык мүлк",
    },
    title: { ru: "ТЦ Манас", ky: "Манас соода борбору" },
    area: { ru: "1 000 м²", ky: "1 000 м²" },
    location: {
      ru: "Пр-т Чынгыза Айтматова, 47а/1",
      ky: "Чыңгыз Айтматов проспекти, 47а/1",
    },
    yieldLabel: { ru: "15%", ky: "15%" },
    payments: { ru: "Ежемесячно", ky: "Ай сайын" },
    status: { ru: "Сдан в аренду", ky: "Ижарага берилген" },
  },
  {
    id: "ankara",
    category: "development",
    image: "/objects/ankara",
    alt: {
      ru: "ЖК Анкара I — строящийся жилой комплекс в Бишкеке",
      ky: "Анкара I турак жай комплекси — Бишкектеги курулуп жаткан үй",
    },
    title: { ru: "ЖК Анкара I", ky: "Анкара I турак жай комплекси" },
    area: { ru: "1 578 м²", ky: "1 578 м²" },
    location: { ru: "ул. Горького, 1", ky: "Горький көчөсү, 1" },
    yieldLabel: { ru: "до 30%", ky: "30%га чейин" },
    deadline: { ru: "4 кв. 2028", ky: "2028-ж. 4-чейрек" },
    payments: { ru: "В конце срока", ky: "Мөөнөттүн аягында" },
    status: { ru: "Строительство", ky: "Курулуп жатат" },
  },
  {
    id: "sheralieva",
    category: "partnership",
    image: "/objects/sheralieva",
    alt: {
      ru: "Шералиева, 286 — коммерческий объект в Бишкеке",
      ky: "Шералиева, 286 — Бишкектеги коммерциялык объект",
    },
    title: { ru: "Шералиева, 286", ky: "Шералиева, 286" },
    area: { ru: "1 636,65 м²", ky: "1 636,65 м²" },
    location: { ru: "ул. Шералиева, 286", ky: "Шералиева көчөсү, 286" },
    yieldLabel: { ru: "до 55%", ky: "55%га чейин" },
    deadline: { ru: "1 кв. 2027", ky: "2027-ж. 1-чейрек" },
    payments: { ru: "В конце срока", ky: "Мөөнөттүн аягында" },
    status: { ru: "Строительство", ky: "Курулуп жатат" },
  },
];
