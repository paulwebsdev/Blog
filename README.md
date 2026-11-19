# PaulNova

**Technology. Intelligence. Opportunities.**

PaulNova is a global digital publication covering technology, artificial intelligence, business and money, education and careers.

## Stack
- Next.js 15 App Router, TypeScript and Tailwind CSS
- Supabase PostgreSQL and Auth with cookie-based SSR sessions
- Public image URLs (including Blogger-hosted direct image URLs); no Supabase Storage bucket is used

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these variables in `.env.local` and in your Netlify site environment:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Optional: `NEXT_PUBLIC_GA_ID` (Google Analytics measurement ID; analytics loads only after visitor consent)
- Optional: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (Google Search Console verification token)
- Optional: `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (publisher ID used only by the admin readiness indicator; it does not activate AdSense)

The publishable key is intended for public client use. Never add a Supabase secret or service-role key to a `NEXT_PUBLIC_` variable or commit secrets to Git.

## Public site
- Responsive homepage and category pages
- Article pages and search read published content from Supabase
- Canonical metadata, Open Graph/Twitter metadata, Article JSON-LD, sitemap and robots.txt
- Related stories, share controls, local-device bookmarks and paginated search/category archives
- Optional Google Analytics gated behind explicit visitor consent; optional Google Search Console verification
- When Supabase is not configured, starter articles are used as a development fallback

## Editorial studio
- Private login at `/admin/login`; no public editor registration
- Protected dashboard, article create/edit/delete, draft/publish/schedule status
- External image URL input with preview and required alt text
- SEO title and description fields
- Subscriber search, status and consent review for administrators
- Article preview, newsletter draft editing and campaign preview
- Monetization studio at `/admin/monetization`: advertiser records and enquiries, direct ad campaigns and placements, sponsored-article disclosures, affiliate-link management, first-party click/impression counts, and a manual actual-revenue ledger
- Public ad placements appear only for active campaigns; ad creatives can use public Blogger image URLs. Affiliate and sponsored content is visibly disclosed.

## First administrator setup
1. In Supabase Dashboard → Authentication → Users, create the first user with the administrator's email and a strong password.
2. Copy that user's Auth UID.
3. In Supabase SQL Editor, run the following, replacing the placeholder with the real UID:
   ```sql
   insert into public.profiles (id, display_name, role)
   values ('AUTH_USER_UUID', 'PaulNova Admin', 'admin');
   ```
4. Add the required environment variables above to Netlify (Builds and Functions scopes), then trigger a deploy.
5. Visit `/admin/login` and sign in. Do not enable public sign-up.

New profiles default to `pending`, which grants no editorial permissions. Promote additional editors only by assigning the `editor` role from a trusted administrator workflow or Supabase SQL Editor.

## Image handling
Paste a direct, publicly accessible HTTPS image URL in the editor (Blogger image URLs are supported). The image is rendered by its source URL and does not consume Supabase Storage.

## Deployment
Connect this repository to Netlify. The included `netlify.toml` uses `npm run build` and `.next`; Netlify's maintained Next.js adapter is detected automatically. Set the required environment variables in the Netlify UI with both Builds and Functions scopes, then deploy. Do not add a static SPA catch-all redirect: this app uses Next.js server rendering and route handlers. Configure `paulnova.name.ng` only after the first successful deploy, following the DNS values shown in Netlify. Google Search Console ownership verification and sitemap submission are external owner steps. Google Search Console ownership verification and sitemap submission are external owner steps. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` after adding the site property. Set `NEXT_PUBLIC_GA_ID` only after creating a Google Analytics web stream; the consent banner controls whether its script loads. Bookmarks are stored locally in the visitor’s browser and are not synced between devices.

## Monetization setup
- Open `/admin/monetization` as the administrator. Create an advertiser, then add a campaign or affiliate link. New campaigns and affiliate links default to draft; review the destination, partner approval, image rights and disclosures before activating.
- Ad placements are currently direct campaigns managed by PaulNova. Clicks and impressions are counted as first-party events; these are not audited traffic, partner conversions or guaranteed earnings. Record revenue only after it has actually been received or confirmed, and keep currencies separate.
- Sponsored articles are linked to existing articles and display a disclosure when activated.
- The `/advertise` page accepts advertiser enquiries, which are visible to administrators in the monetization studio.
- Google AdSense is not connected or activated. The readiness panel does not load the AdSense script. Apply and receive approval first; then complete publisher ID, ads.txt and consent requirements before enabling any external ad network. No AdSense approval or earnings are guaranteed.
- Affiliate programs are not pre-connected. Apply directly to each partner, use only approved tracking URLs, and disclose commissions near the relevant recommendation.
- No ad network or affiliate conversion API is connected by default. Newsletter email delivery is intentionally paused: drafts and previews remain available, but bulk sending stays disabled until a sending provider, sender domain, and unsubscribe/suppression handling are fully configured and tested.
