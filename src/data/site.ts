/** Brand + contact constants, mirrored from esmar.kg */
export const site = {
  brand: "Esmar",
  legalName: "ОсОО «УК Нур Капитал»",
  phone: "+996222111114",
  phoneDisplay: "+996 222 111 114",
  email: "info@esmar.kg",
  telegram: "https://t.me/+996222111114",
  instagram: "https://www.instagram.com/esmar_kg/",
  facebook: "https://www.facebook.com/profile.php?id=61594200847475",
  parentSite: "https://esmar.kg",
  privacy: "https://esmar.kg/dokumenty",
  licenseNumber: "№88",
  licenseDate: "07.08.2026",
} as const;

/** WhatsApp number in E.164 digits, overridable through env */
export const whatsappNumber =
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "996222111114").replace(/\D/g, "");

export function whatsappLink(text: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}
