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

Set these variables in `.env.local` and in the Vercel project:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intended for public client use. Never add a Supabase secret or service-role key to a `NEXT_PUBLIC_` variable or commit secrets to Git.

## Public site
- Responsive homepage and category pages
- Article pages and search read published content from Supabase
- Canonical metadata, Open Graph/Twitter metadata, Article JSON-LD, sitemap and robots.txt
- When Supabase is not configured, starter articles are used as a development fallback

## Editorial studio
- Private login at `/admin/login`; no public editor registration
- Protected dashboard, article create/edit/delete, draft/publish/schedule status
- External image URL input with preview and required alt text
- SEO title and description fields
- Subscriber overview for administrators

## First administrator setup
1. In Supabase Dashboard → Authentication → Users, create the first user with the administrator's email and a strong password.
2. Copy that user's Auth UID.
3. In Supabase SQL Editor, run the following, replacing the placeholder with the real UID:
   ```sql
   insert into public.profiles (id, display_name, role)
   values ('AUTH_USER_UUID', 'PaulNova Admin', 'admin');
   ```
4. Add the three environment variables above to Vercel and redeploy.
5. Visit `/admin/login` and sign in. Do not enable public sign-up.

New profiles default to `pending`, which grants no editorial permissions. Promote additional editors only by assigning the `editor` role from a trusted administrator workflow or Supabase SQL Editor.

## Image handling
Paste a direct, publicly accessible HTTPS image URL in the editor (Blogger image URLs are supported). The image is rendered by its source URL and does not consume Supabase Storage.

## Deployment
Connect this repository to Vercel, set the environment variables, and configure the domain after DNS is ready. Google Search Console and Bing Webmaster Tools verification/submission are external owner steps.
