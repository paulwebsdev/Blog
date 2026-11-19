# PaulNova newsletter delivery with Brevo

PaulNova stores subscriber consent and campaign drafts in Supabase. Brevo is the planned marketing-email delivery provider. The integration is prepared in code, but production delivery is not configured or verified yet.

## Server-side environment variables

Set these only in the hosting provider's encrypted server environment. Never prefix the API key with `NEXT_PUBLIC_`.

- `BREVO_API_KEY`: server-only Brevo API key with contact-list and email-campaign permissions.
- `BREVO_SENDER_EMAIL`: an active, verified sender address in Brevo.
- `BREVO_SENDER_NAME`: normally `PaulNova`.
- `BREVO_REPLY_TO`: optional reply address; defaults to the sender address.
- `BREVO_LIST_ID`: optional override. If omitted, PaulNova finds or creates a dedicated list named **PaulNova Newsletter** in Brevo folder 1.

Never paste an API key into chat, source code, GitHub, or a public environment variable. Add it directly to the hosting provider's encrypted environment settings.

## Current Brevo account findings

Last checked on 19 November 2026:

- Account company: `Dsquare`.
- Plan: Free, with 300 email credits.
- Existing list: `Your first list` (ID 2). PaulNova must not repurpose this unrelated list.
- Existing active sender: `paulbamigbaye@gmail.com`.
- No sending domains have been added or authenticated.
- No PaulNova-specific list has been created yet. The app can create it automatically when its server-side Brevo API key is configured and the admin test-send action is run.

## Implemented application workflow

1. Newsletter drafts can be created, edited, and previewed in the PaulNova admin.
2. The admin-only test action finds or creates **PaulNova Newsletter**.
3. It creates a Brevo campaign draft if needed and requests a test send only to the currently signed-in administrator's email address.
4. The test action does not send a campaign to subscribers or mark the Supabase campaign as sent.
5. The admin must initiate a test from the PaulNova admin and then check the receiving inbox. A successful API response only confirms that Brevo accepted the test request; it does not prove inbox delivery.

## Bulk sending is deliberately blocked

The bulk-send server action currently stops with an error. It does not import contacts or send to subscribers. This is intentional: the integration still needs verified unsubscribe, complaint, bounce, and consent/suppression handling before any subscriber campaign can be enabled.

Do not remove this block until:
- Supabase consented subscribers are synchronized without overriding Brevo blacklists or suppression states.
- Brevo unsubscribe, complaint, and hard-bounce events are reliably reflected in Supabase.
- Unsubscribe links are tested end to end.
- Sender/domain authentication and inbox delivery have been checked.
- A separate explicit approval is given before the first real subscriber campaign.

## Domain and sender setup still required

1. Add `paulnova.name.ng` in Brevo under Settings > Senders & IP > Domains (menu wording may vary).
2. Copy the exact DNS records Brevo generates (domain verification and DKIM; SPF/DMARC only as instructed).
3. Add those exact records at the domain DNS provider. Do not create a second SPF TXT record if one already exists.
4. Wait for Brevo to verify/authenticate the domain.
5. Add and verify a sender such as `newsletter@paulnova.name.ng`.
6. Configure a mailbox or forwarding service separately if replies must be received. DNS authentication does not create a mailbox.

Do not guess or pre-create DNS records. Use the exact values shown by Brevo for this account.

## Current completion checklist

- [x] Newsletter draft creation, editing, and preview in PaulNova.
- [x] Server-side Brevo API helper.
- [x] Admin-only test-send action in application code.
- [x] Dedicated-list auto-creation logic in application code.
- [x] Bulk sending blocked pending suppression safeguards.
- [ ] Configure the Brevo API key in the hosting environment.
- [ ] Authenticate `paulnova.name.ng` in Brevo.
- [ ] Verify a domain-based sender.
- [ ] Run and inspect a real test email.
- [ ] Implement and test Brevo event synchronization for unsubscribes, complaints, and hard bounces.
- [ ] Re-verify consent/suppression handling before enabling bulk sending.
- [ ] Explicitly approve the first real subscriber campaign.

No subscriber campaign has been sent by this integration.
