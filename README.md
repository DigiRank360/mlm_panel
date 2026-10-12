# AyurvaPro MLM Member Portal

A responsive React/Vite frontend prototype for an MLM member portal. It includes business overview, binary placement network, member registration, commissions, orders, withdrawals, marketing tools, and profile settings.

## Run locally

```sh
npm install
npm run dev
```

## Project layout

```text
src/
  components/
    common/       Shared portal UI
    network/      Binary tree, member table, add-member form and styles
  context/        Shared MLM member state and hook
  data/           Demo members, commissions, orders and chart values
  pages/          Overview, network, commissions, orders, withdrawals,
                  marketing and settings screens
  App.jsx         Navigation shell and page composition
```

## Frontend demo notes

- Share the personal referral URL from **Marketing tools**. It opens registration with the sponsor already selected.
- New accounts choose an open binary position and a package. The package order and personal PV are attached to that member.
- Members sign in with their own email and password. A referral signup creates credentials and starts that member's session; signing out returns to the login screen.
- Seeded demo logins use `riya.kapoor@example.com` / `Riya@123`, `aarav.sharma@example.com` / `Aarav@123`, `meera.iyer@example.com` / `Meera@123`, `kabir.patel@example.com` / `Kabir@123`, and `ananya.reddy@example.com` / `Ananya@123`.
- Account data is saved in local storage and the signed-in member ID in session storage. Passwords are hashed in this prototype, but browser-side data and checks are not a security boundary.
- Package enrollment does not process payment. Production isolation requires server-side authentication, authorization on every API, protected database storage, bank payout integration, and the approved compensation-plan rules.

Run `npm run lint` and `npm run build` to check the project.
