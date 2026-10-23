# AyuvaPro MLM Member Portal

The member portal uses the AyuvaPro backend for member login, registration, package details, referrals, payments, profile information and other member data. Registration creates a pending member account; payment verification and administrator approval control activation.

## Local development

Run the backend, then start the panel:

```sh
npm install
npm run dev
```

The Vite development server uses `http://localhost:5174` so it can run beside the storefront on its default port. The panel API defaults to `http://localhost:5000/api`, while the backend server defaults to port `3000`; set `VITE_API_URL=http://localhost:3000/api` in both the panel and storefront if you are using the backend's default port. Otherwise set it to the backend API URL in each app's deployment environment.

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
