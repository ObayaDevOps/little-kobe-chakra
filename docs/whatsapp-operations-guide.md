# WhatsApp Operations Guide (Support Team)

## Purpose
Use this guide to:
- choose the active WhatsApp provider
- run a live health check
- send a live test message
- create and maintain support templates
- recover quickly if Baileys has issues

## Provider Basics
- `Meta API`: the stable default provider.
- `Baileys WA`: alternative provider used for text-template workflows.

## Before You Test
1. Open Admin Control Center.
2. Go to `WhatsApp Live Test`.
3. Confirm the global provider and fallback setting.
4. Run `Health check`.

## Read Health Check Results
- `Healthy`: active provider is ready.
- `Issue`: active provider is not ready.
- In the payload:
- `activeProvider` shows which provider will be used.
- `providers.meta_api` shows Meta status.
- `providers.baileys_wa` shows Baileys auth/session state.

## Send a Live Test Message
1. In `WhatsApp Live Test`, choose `Provider for this test`.
2. Pick a template (for Baileys) or keep default.
3. Enter recipient in full international format (`+256...`).
4. Click `Send test message`.
5. Check response panel:
- `provider` = provider that actually sent the message.
- `fallbackUsed` = `true` means Baileys failed and Meta sent instead.

## Change Global Provider
1. In `WhatsApp Live Test`, under `Global Provider Settings`, choose:
- `Meta API` or `Baileys WA`
2. Set `Auto-fallback to Meta` as needed.
3. Click `Save provider settings`.

## Create a New Template
1. Open `WhatsApp Templates`.
2. Click into the form and set:
- `Name`
- `Provider scope`
- `Body text`
3. Use placeholders like:
- `{{customerName}}`
- `{{itemsLine}}`
- `{{deliveryLocation}}`
- `{{orderStatus}}`
- `{{paymentMethod}}`
- `{{customerPhone}}`
4. Click `Preview`.
5. Click `Create template`.

## Edit or Remove a Template
1. In `Saved templates`, click `Edit` to modify.
2. Click `Update template` to save.
3. Click `Delete` to remove a template.

## Recommended Template (Example)
Use this style for support order alerts:

```text
New Website Order - Action Required

Customer name: {{customerName}}
Item: {{itemsLine}}
Delivery location: {{deliveryLocation}}

Status: {{orderStatus}}
Payment method: {{paymentMethod}}

Please:
- Confirm payment once received
- Start order preparation immediately after payment
- Allow approx. 30min for preparation
- Inform management once the order is ready and when it is dispatched

Delivery location: {{deliveryLocation}}

The customer will be notified separately.
For questions, contact the customer: {{customerPhone}}.
```

## Quick Recovery Checklist
1. If Baileys has issues, switch global provider to `Meta API`.
2. Keep `Auto-fallback to Meta` enabled.
3. Re-run health check.
4. Send one live test message.
5. Report issue details to engineering:
- time
- recipient test number
- response payload from admin page
- active provider and fallback status
