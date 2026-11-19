# PaulNova newsletter delivery with Brevo

PaulNova stores subscriber consent and campaign drafts in Supabase. Brevo handles marketing email delivery.

## Server-side environment variables

Set these only in the hosting provider's encrypted server environment. Never prefix the API key with `NEXT_PUBLIC_`.

- `BREVO_API_KEY`: a Brevo API key with contact-list, contact-import and email-campaign permissions.
- `BREVO_SENDER_EMAIL`: an active sender address in Brevo. The current account has a Gmail sender; for production, use a domain sender after authenticating `paulnova.name.ng`.
- `BREVO_SENDER_NAME`: normally `PaulNova`.
- `BREVO_REPLY_TO`: optional reply address; defaults to the sender address.
- `BREVO_LIST_ID`: optional override. If omitted, PaulNova finds or creates a dedicated list named **PaulNova Newsletter** in Brevo folder 1.

## Current Brevo account findings

- Account is on the Free plan with 300 email credits.
- Existing list: `Your first list` (ID 2). PaulNova will not repurpose this unrelated list.
- Existing active sender: `paulbamigbaye@gmail.com`.
- No sending domains have been added or authenticated yet.

## Automated setup and test workflow

1. On the first admin test-send, the server finds or creates **PaulNova Newsletter** automatically.
2. The admin-only test action creates/uses a Brevo campaign draft and sends a test copy only to the signed-in administrator's email address.
3. Test sending does not send to the subscriber list and does not mark the Supabase campaign as sent.
4. The full-send action imports only Supabase subscribers whose status is `active` and whose `consent_at` is present, then sends the campaign after explicit confirmation.
5. The local campaign is marked sent only after Brevo accepts the send request.

## Domain and sender setup still required

1. Add `paulnova.name.ng` under Brevo Settings > Senders & IP > Domains (menu wording may vary).
2. Copy the exact DNS records Brevo generates (verification and DKIM; SPF/DMARC where instructed).
3. Add those records at the domain DNS provider. Do not create a second SPF TXT record if one already exists.
4. Wait for Brevo to verify the domain, then create/verify a sender such as `newsletter@paulnova.name.ng`.
5. DNS authentication does not create a mailbox. Set up a mailbox or forwarding service separately if replies must be received at that address.

## Safety notes

- The existing list ID 2 is deliberately not used as PaulNova's mailing list.
- Test emails go only to the signed-in admin address.
- Bulk sending remains hidden from the newsletter UI until the integration is configured and tested.
- Brevo's native `{{ unsubscribe }}` placeholder is included in the campaign footer. Verify unsubscribe behavior during the first test.
- Do not send bulk campaigns until domain authentication, test rendering and unsubscribe behavior have been checked.
