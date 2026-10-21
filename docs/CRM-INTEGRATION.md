# CRM ⇄ Landing: контракт интеграции

Два независимых потока:

```
Браузер ──► /api/lead ──► CRM webhook  (lead.created, атрибуция)
                       └► Meta CAPI    (Contact)

CRM ──► /api/crm/lead  (stage) ──► Meta CAPI (Lead / QualifiedLead / … / Purchase)
```

Первый поток создаёт лид и отдаёт всю атрибуцию. Второй — сообщает, что произошло
дальше, чтобы Meta оптимизировалась на нужное действие.

---

## 1. Исходящий webhook: `lead.created`

`POST $CRM_WEBHOOK_URL`

Заголовки:

```
content-type: application/json
x-esmar-event: lead.created
x-esmar-signature: t=1792586907,v1=21325e46ef33db…
user-agent: EsmarLanding/1.0 (+crm-webhook)
```

Тело:

```json
{
  "event": "lead.created",
  "signature_version": 1,
  "lead_id": "ESM-EX57V9",
  "created_at": "2026-10-21T12:48:27.512Z",
  "locale": "ru",
  "amount": { "tier": "s2", "value": 2750, "label": "500 – 5 000 $", "currency": "USD" },
  "contacts": { "phone": null, "email": null },
  "click_ids": {
    "fbclid": "FB_CLICK_1",
    "fbc": "fb.1.1792586907000.FB_CLICK_1",
    "fbp": "fb.1.1730000000000.1234567890",
    "ctwa_clid": null,
    "gclid": null, "gbraid": null, "wbraid": null,
    "ttclid": null, "yclid": null, "msclkid": null, "twclid": null
  },
  "utm": { "source": "facebook", "medium": "paid", "campaign": "ru_q4", "content": "reels" },
  "page": {
    "landing_url": "https://land.esmar.kg/ru?fbclid=FB_CLICK_1",
    "current_url": "https://land.esmar.kg/ru",
    "referrer": "https://l.facebook.com/"
  },
  "meta": {
    "pixel_id": "123456789012345",
    "external_id": "ESM-EX57V9",
    "dedupe_event_id": "ESM-EX57V9-lead"
  },
  "attribution": {
    "fbclid": "FB_CLICK_1",
    "fbc": "fb.1.1792586907000.FB_CLICK_1",
    "fbp": "fb.1.1730000000000.1234567890",
    "utm": { "source": "facebook", "medium": "paid", "campaign": "ru_q4", "content": "reels" },
    "referrer": "https://l.facebook.com/",
    "landing_url": "https://land.esmar.kg/ru?fbclid=FB_CLICK_1",
    "ga_client_id": "999.888",
    "visitor_id": "11111111-2222-3333-4444-555555555555",
    "locale": "ru",
    "browser_lang": "ru-RU",
    "timezone": "Asia/Bishkek",
    "screen": "390x844",
    "device": "mobile",
    "first_seen_at": "2026-10-21T12:47:02.000Z",
    "last_seen_at": "2026-10-21T12:48:27.500Z",
    "click_ts": 1792586800,
    "ip": "185.10.20.30",
    "ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 …)",
    "country": "kg",
    "city": "Bishkek"
  },
  "whatsapp": { "number": "996222111114", "message_ref": "ESM-EX57V9" }
}
```

### Ответ

Любой `2xx` — доставлено (`lead.status = crm_sent`). Иначе лид помечается
`crm_failed`, `crm_attempts++`, и cron переотправляет (до 6 попыток, экспоненциальный
бэкофф у CAPI, каждые 5 минут для CRM).

Рекомендуется отвечать `200` быстро (до 8 c таймаута) и создавать карточку асинхронно.

### Куда мапить (пример)

| Поле CRM | Значение |
| --- | --- |
| Название сделки | `Esmar · {amount.label}` |
| Источник | `utm.source` + `utm.campaign` |
| ID объявления / кампании | `utm.id`, `utm.content` |
| fbclid / fbc / fbp | отдельные поля (нужны для повторной отправки в Meta) |
| Язык | `locale` (`ru` / `ky`) |
| Комментарий | `page.landing_url`, `referrer` |
| Метка чата WhatsApp | `whatsapp.message_ref` = `lead_id` |

---

## 2. Проверка подписи

Формат: `x-esmar-signature: t=<unix>,v1=<hex hmac_sha256>`,
HMAC считается по строке `"<t>.<raw body>"`. Допуск по времени — 300 секунд.

### Node.js

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(req, rawBody, secret) {
  const header = req.headers["x-esmar-signature"] ?? "";
  const { t, v1 } = Object.fromEntries(header.split(",").map((p) => p.trim().split("=")));
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}
```

### PHP

```php
$raw = file_get_contents('php://input');
$header = $_SERVER['HTTP_X_ESMAR_SIGNATURE'] ?? '';
preg_match('/t=(\d+),v1=([a-f0-9]+)/', $header, $m);
$expected = hash_hmac('sha256', $m[1] . '.' . $raw, getenv('ESMAR_SECRET'));
if (!hash_equals($expected, $m[2]) || abs(time() - (int)$m[1]) > 300) {
    http_response_code(401);
    exit;
}
```

### Python

```python
import hmac, hashlib, time, re

def verify(raw: bytes, header: str, secret: str) -> bool:
    m = re.match(r"t=(\d+),v1=([a-f0-9]+)", header or "")
    if not m: return False
    ts, sig = m.group(1), m.group(2)
    if abs(time.time() - int(ts)) > 300: return False
    expected = hmac.new(secret.encode(), f"{ts}.".encode() + raw, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)
```

---

## 3. Входящий вызов: `POST /api/crm/lead`

Заголовок подписи — тот же, секрет `CRM_INBOUND_SECRET` (fallback `CRM_WEBHOOK_SECRET`).

```json
{
  "lead_id": "ESM-EX57V9",
  "stage": "card_created",
  "crm_lead_id": "1284",
  "crm_event_id": "1284-card-created",
  "occurred_at": "2026-10-21T12:50:00Z",
  "value": 2750,
  "currency": "USD",
  "phone": "+996 555 123 456",
  "manager": "Айгуль"
}
```

Обязательные: `lead_id`, `stage`. Остальное — по желанию.

Ответ:

```json
{ "ok": true, "event_id": "crm-1284-card-created", "event_name": "Lead", "status": "sent" }
```

Ошибки:

| Код | Значение |
| --- | --- |
| 401 | подпись/таймстамп неверны |
| 404 | `lead_id` не найден (лендинг не сохранил лид — проверьте `DATABASE_URL`) |
| 422 | неизвестная стадия / невалидное тело |
| 503 | не задан `CRM_INBOUND_SECRET` |

### Правила

- `event_id` = `crm-<crm_event_id>` (если передан) — повторный вызов не создаст дубль.
- `stage` маппится по таблице из README; `event_name` может переопределить маппинг.
- `value` попадает в `custom_data.value`, валюта — в `custom_data.currency`.
- `phone` хешируется SHA-256 и уходит в `user_data.ph` (в логи и CRM не пишется).
- `action_source` для CRM-событий — `system_generated` (настраивается
  `META_ACTION_SOURCE_CRM`).

### Когда звать

| Момент в CRM | `stage` |
| --- | --- |
| карточка создана (базовый лид) | `card_created` |
| менеджер квалифицировал | `qualified` |
| назначена встреча | `meeting_booked` |
| встреча/визит состоялись | `meeting_held` |
| договор отправлен/подписан | `contract_sent` / `contract_signed` |
| сделка закрыта | `deal_won` |
| отказ | `lost` |

---

## 4. Meta CAPI: что уходит

`POST https://graph.facebook.com/v23.0/{pixel_id}/events`

```json
{
  "data": [{
    "event_name": "Lead",
    "event_time": 1792587000,
    "event_id": "crm-1284-card-created",
    "action_source": "system_generated",
    "event_source_url": "https://land.esmar.kg/ru?fbclid=FB_CLICK_1",
    "user_data": {
      "fbc": "fb.1.1792586907000.FB_CLICK_1",
      "fbp": "fb.1.1730000000000.1234567890",
      "client_ip_address": "185.10.20.30",
      "client_user_agent": "Mozilla/5.0 …",
      "external_id": ["<sha256(lead_id)>"],
      "ph": ["<sha256(996555123456)>"],
      "country": "kg"
    },
    "custom_data": {
      "currency": "USD",
      "value": 2750,
      "content_name": "500 – 5 000 $",
      "content_ids": ["s2"],
      "content_category": "real_estate_investment",
      "lead_id": "ESM-EX57V9",
      "crm_lead_id": "1284",
      "crm_stage": "card_created",
      "locale": "ru",
      "event_origin": "crm"
    }
  }],
  "test_event_code": "TEST12345",
  "access_token": "…"
}
```

Дедупликация: браузерный `Contact` и серверный `Contact` идут с одним `event_id`
(`ESM-…-contact`). `PageView` — аналогично. CRM-события уникальны по `crm_event_id`.

---

## 5. Ретраи и наблюдаемость

- Все CAPI-события пишутся в таблицу `events` со статусом `pending|sent|failed|skipped`.
- `/api/cron/dispatch` (каждые 5 минут) добивает `failed` и `pending`
  (до 6 попыток, бэкофф 30 s → 1 h).
- CRM-лиды с `crm_failed` переотправляются тем же cron.
- `/admin?token=$ADMIN_TOKEN` — лиды, события, ошибки, счётчики.
- Логи приложения: `[esmar][crm] webhook rejected 500 …`.

---

## 6. Локальная проверка

```bash
# 1. поднять моки CRM + Meta
node scripts/mock-integrations.mjs

# 2. в .env.local
CRM_WEBHOOK_URL=http://localhost:3999/crm/lead
CRM_WEBHOOK_SECRET=local_test_secret_123
CRM_INBOUND_SECRET=local_test_secret_123
META_PIXEL_ID=123456789012345
META_CAPI_TOKEN=TEST_TOKEN
META_GRAPH_BASE_URL=http://localhost:3999
META_TEST_EVENT_CODE=TEST123

# 3. создать лид
curl -X POST localhost:3000/api/lead -H 'content-type: application/json' \
  -d '{"amount_tier":"s2","locale":"ru","attribution":{"fbclid":"X","landing_url":"https://land.esmar.kg/ru","visitor_id":"v1"}}'

# 4. отправить стадию (скрипт сам подпишет)
node scripts/sign.mjs '{"lead_id":"ESM-XXXXXX","stage":"card_created"}' local_test_secret_123 http://localhost:3000/api/crm/lead

# 5. посмотреть, что реально ушло
cat /tmp/esmar_mock.log
```
