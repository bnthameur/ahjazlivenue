# Production Setup Guide (Ahjazli Qaati)

This guide configures three separate deployments with zero OAuth callback mismatch:

- Admin: `admin.ahjazliqaati.com`
- App: `app.ahjazliqaati.com`
- Landing: `ahjazliqaati.com`

---

## 1) Supabase Auth (Google OAuth) — Required

### A) Google Cloud Console (OAuth Client)
1. Create (or select) a Google Cloud project.
2. Configure the OAuth consent screen (External).
   - Add your authorized domains (for example: `ahjazliqaati.com`).
   - Add homepage and privacy policy URLs hosted on authorized domains (Google requires this for production apps).
3. Create OAuth client ID → Web application.
4. In Authorized JavaScript origins, add your app URLs:
   - `https://app.ahjazliqaati.com`
   - `https://admin.ahjazliqaati.com`
5. In Authorized redirect URIs, add your Supabase callback URL:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - You can copy this exact URL from Supabase → Authentication → Providers → Google.

### B) Supabase Dashboard (Google Provider)
1. Go to Supabase → Authentication → Providers → Google.
2. Paste Client ID and Client Secret from Google Cloud.
3. Save.

### C) Supabase Dashboard (Redirect Allow List)
1. Go to Supabase → Authentication → URL Configuration.
2. Add the exact redirect URLs used by the apps:
   - `https://app.ahjazliqaati.com/api/auth/callback`
   - `https://admin.ahjazliqaati.com/auth/callback`

---

## 2) Railway Deployments

Create three Railway services, each connected to its own GitHub repo and set a Root Directory:

- Admin service
  - Root Directory: `adminahjazli`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start`

- App service
  - Root Directory: `ahjazliqaatiapp2`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start`

- Landing service
  - Root Directory: `landing-page`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start`

### Environment Variables (Railway)

Admin (`adminahjazli`)
- `NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>`

App (`ahjazliqaatiapp2`)
- `NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>`
- `GEMINI_API_KEY=<your-gemini-api-key>`

Landing (`landing-page`)
- No required env vars (currently).

---

## 3) Custom Domains (DNS)

In Railway → Service → Domains, add each custom domain and follow the DNS records Railway provides:

- `admin.ahjazliqaati.com` → Admin service
- `app.ahjazliqaati.com` → App service
- `ahjazliqaati.com` → Landing service

Make sure you complete any required DNS validation before proceeding.

---

## 4) OAuth Mismatch Checklist (Final)

1. App login should redirect to:
   - `https://app.ahjazliqaati.com/api/auth/callback?next=/<locale>/dashboard`
2. Admin login should redirect to:
   - `https://admin.ahjazliqaati.com/auth/callback`
3. Both callback URLs are in Supabase → URL Configuration allow list.
4. Google OAuth Authorized redirect URI points to the Supabase callback URL.

If any of those is missing, Google/Supabase will return a callback mismatch or redirect to the wrong domain.
