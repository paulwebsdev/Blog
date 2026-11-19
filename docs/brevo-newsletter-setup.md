# PaulNova newsletter delivery with Brevo

PaulNova stores subscriber consent and campaign drafts in Supabase. Brevo is the delivery provider for marketing campaigns.

## Required server-side environment variables

Set these only in the hosting provider's server environment. Never prefix the API key with `NEXT_PUBLIC_`.

- `BREVO_API_KEY`: a Brevo API key with contact import and email campaign permissions.
- `BREVO_LIST_ID`: numeric ID of the dedicated PaulNova newsletter contact list in Brevo.
- `BREVO_SENDER_EMAIL`: verified sender address, for example `newsletter@paulnova.name.ng`.
- `BREVO_SENDER_NAME`: normally `PaulNova`.
- `BREVO_REPLY_TO`: optional reply address; defaults to the sender address.

## Brevo account preparation

1. Create a dedicated contact list named **PaulNova Newsletter** under Contacts > Lists.
2. Copy its numeric list ID into `BREVO_LIST_ID`.
3. Add and verify the sender address in Campaigns/Senders & IP (the exact menu label may vary).
4. Authenticate `paulnova.name.ng` in Brevo by adding the DNS records Brevo provides (typically DKIM and a domain verification record; configure SPF and DMARC carefully without creating duplicate SPF records).
5. Keep the API key private. Add it only as `BREVO_API_KEY` in the hosting provider's encrypted environment-variable settings.

## Sending workflow

- Only administrators can send campaigns.
- The send action includes subscribers whose Supabase status is `active` and whose `consent_at` is present.
- Subscribers are imported to the dedicated Brevo list in batches and Brevo's import process is checked before campaign creation.
- A campaign is created in Brevo, its ID is stored in `newsletter_campaigns.brevo_campaign_id`, then the campaign is sent.
- The local campaign is marked `sent` only after Brevo accepts the send request.
- The confirmation dialog is intentional: sending cannot be undone.
- The email includes Brevo's `{{ unsubscribe }}` link. Brevo's native list suppression should be respected for later campaigns; verify this during the first real test.

## Before first real campaign

1. Complete sender and domain authentication.
2. Use a small internal test list first.
3. Send a test campaign to addresses controlled by the PaulNova team.
4. Confirm rendering on mobile and desktop, links, inbox placement, and unsubscribe behavior.
5. Only then send to the full consented list.

Do not send bulk campaigns until the sender domain is authenticated and the first test passes.
