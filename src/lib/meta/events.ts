/**
 * Funnel stage → Meta event name.
 * The CRM sends us the stage; we translate it into the event that Meta optimises for.
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
export type StageRule = {
  event: string;
  /** use the lead's amount as conversion value */
  useLeadValue?: boolean;
  description: string;
};

export const CRM_STAGE_MAP: Record<string, StageRule> = {
  // card appears in CRM = basic lead
  card_created: { event: "Lead", description: "Карточка создана в CRM (базовый лид)" },
  basic_lead: { event: "Lead", description: "Базовый лид" },
  new_lead: { event: "Lead", description: "Новый лид" },
  lead: { event: "Lead", description: "Лид" },

  qualified: { event: "QualifiedLead", description: "Квалифицирован менеджером" },
  qualification: { event: "QualifiedLead", description: "Квалификация пройдена" },

  meeting_booked: { event: "Schedule", description: "Назначена встреча" },
  meeting: { event: "Schedule", description: "Встреча" },

  meeting_held: { event: "MeetingHeld", description: "Встреча проведена" },
  office_visit: { event: "MeetingHeld", description: "Визит в офис" },

  contract_sent: { event: "SubmitApplication", description: "Договор отправлен" },
  contract_signed: { event: "SubmitApplication", description: "Договор подписан" },

  deal_won: { event: "Purchase", useLeadValue: true, description: "Сделка закрыта" },
  paid: { event: "Purchase", useLeadValue: true, description: "Оплата получена" },

  lost: { event: "LeadDisqualified", description: "Отказ / нецелевой" },
  disqualified: { event: "LeadDisqualified", description: "Нецелевой" },
};

export const SITE_EVENTS = {
  pageView: "PageView",
  viewContent: "ViewContent",
  amountSelected: "SelectAmount",
  whatsappClick: "Contact",
} as const;

/** Meta custom events must match ^[A-Za-z][A-Za-z0-9_]{1,39}$ */
export function isValidEventName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]{1,39}$/.test(name);
}

export function resolveStage(stage: string): StageRule | null {
  const key = stage.trim().toLowerCase();
  if (CRM_STAGE_MAP[key]) return CRM_STAGE_MAP[key];
  // allow explicit Meta event names from the CRM, e.g. "Lead" or "CustomEvent"
  if (isValidEventName(stage)) return { event: stage, description: "explicit" };
  return null;
}
