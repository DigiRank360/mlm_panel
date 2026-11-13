# AyuvaPro MLM Member Portal

The member portal uses the AyuvaPro backend for member login, registration, package details, referrals, payments, profile information and other member data. Registration creates a pending member account; payment verification and administrator approval control activation.

## Local development

Run the backend, then start the panel:

```sh
npm install
npm run dev
```

The Vite development server uses the fixed port `3003` (and exits if that port is already in use). The storefront uses `http://localhost:3001` and the admin dashboard uses `http://localhost:3002`. The panel API defaults to the local backend at `http://localhost:5000/api`; set `VITE_API_URL` in the panel and storefront only if your backend uses a different URL.

## Storefront integration

The storefront's Refer & Earn page sends visitors to this portal:

- `/?register=true` opens member registration.
- `/?register=true&ref=MEMBER_CODE` opens registration with the referring member selected.
- `/` opens member sign-in.

Set `VITE_MLM_PANEL_URL` in the storefront's deployment environment to this portal's deployed base URL. Set `VITE_API_URL` in this panel's deployment environment to the deployed backend API URL. Add both deployed frontend origins to the backend's `CORS_ALLOWED_ORIGINS` comma-separated environment setting. Keep these values as deployment configuration rather than committing environment-specific URLs.

Referral links in the portal use the signed-in member's member code. Share only the generated portal referral link so sponsor attribution is retained.

## Checks

```sh
npm run lint
npm run build
```
