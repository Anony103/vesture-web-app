# Vesture Web

Responsive Next.js App Router + TypeScript + Tailwind CSS implementation of the authentication, onboarding, dashboard, and investment screens in the supplied [Figma file](https://www.figma.com/design/SMdcqDaFIL1TSSBzLhxCZu/Untitled?node-id=0-1).

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Start at **Sign Up** to explore registration. Use fictional details and preview verification code **1234**.

```sh
npm run build
npm run start
npm run typecheck
npm exec playwright install chromium
npm run test:e2e
```

The build and development scripts use webpack because Turbopack's worker port binding is restricted in the development environment.

## Screens

| Route                  | Screen                                                  |
| ---------------------- | ------------------------------------------------------- |
| `/`                    | Login, illustrative portfolio, Google/Facebook controls |
| `/signup/account-type` | Private/public sector selection                         |
| `/signup/details`      | Profile photo and personal details                      |
| `/signup/verify`       | Four-digit code, resend timer and validation            |
| `/signup/identity`     | Drag-and-drop identity document selection               |
| `/signup/review`       | Details, editing and account-specific consent           |
| `/signup/password`     | Password creation and confirmation                      |
| `/signup/complete`     | Explicit preview completion                             |
| `/forgot-password`     | Password reset form                                     |

Seven supplied screens are reproduced; reset and completion pages extend the same design system. Registration links enforce earlier steps. Reloading clears the in-memory registration draft and returns to account selection.

## Reusable component structure

```text
src/
  app/                   Route composition and global theme
  components/
    ui/                  Generic reusable controls
    auth/                Reusable authentication layouts and forms
    workspace/           Dashboard, navigation, activity and profile
    investments/         Product cards, catalog and shared creation wizard
  lib/                   Shared types, options and class utilities
public/figma/            Original exported Figma images and icons
tests/                   Desktop/mobile Playwright flows
```

`Button` supports primary, login, secondary, ghost, and upload variants; size and full-width props; and all native button attributes. `Input` supports labels, errors, hints, leading/trailing content, filled/pill variants, and native input attributes. `PasswordInput` composes `Input` and `Button` instead of duplicating either control.

Other primitives include `Select`, `Checkbox`, `OtpInput`, `FileUpload`, `Card`, `FormHeading`, `Divider`, `Notice`, and `AssetIcon`. Domain components include `Brand`, `AuthShell`, `PortfolioPanel`, `StatCard`, `AccountOption`, `AvatarUpload`, and `DetailRow`. Forms are independent components; pages only compose them. Tokens live in `src/app/globals.css`. The fonts are self-hosted through Fontsource packages, and Figma assets are local rather than expiring remote URLs.

## Integration status

Sign up (both private and public sector) and sign in are connected to the Java backend, mirroring how the Flutter mobile app integrates the same endpoints:

- Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (defaults to `http://localhost:8082`).
- The `details` step calls `POST /auth/start-signup` (no password yet) and stores the returned `signupId`. Public-sector accounts validate their IPPIS number inline via `GET /auth/employer-info/{ippisNumber}` before this can succeed, same as `StaffInformationScreen` on mobile.
- The `verify` step only captures the 6-digit code locally — like `PublicVerifyAccountScreen`/`VerifyAccountScreen` on mobile, it does not call the backend itself.
- The `password` step calls `POST /auth/complete-signup` with everything collected so far (including the OTP and, when selected, the identity/avatar files as base64 data URIs). This is where OTP validity, duplicate email/IPPIS, and account creation are actually enforced server-side.
- Sign in calls `POST /auth/login` and stores the returned JWT in `localStorage`.
- Forgot password (`/forgot-password`) is a real 3-step flow: `POST /auth/forgot-password` (email) → `POST /auth/verify-password-reset-otp` (email + 6-digit code, checked server-side, with a resend via `POST /auth/resend-password-reset-otp`) → `POST /auth/reset-password` (new password). This matches `ForgotPasswordScreen`/`VerifyResetOtpScreen`/`ResetPasswordScreen` on mobile.
- Every route under `/dashboard`, `/investments`, `/transactions`, and `/settings` is gated by `AuthGuard` (`src/components/auth/auth-guard.tsx`). With no stored token, or a token `GET /api/user/get-logged-in-user` rejects, none of that UI renders - the visitor is redirected to sign in instead. The signed-in user's real name, email, and initials (from that same endpoint) seed `AccountProvider`'s profile and the sidebar avatar, replacing the previous hardcoded "Joy Oyeledun"/"JO" preview identity. The dashboard, settings, and sidebar "Customer ID" now show the real `uniqueRef` (private-sector accounts only; `---` for public-sector, matching `home_screen.dart` on mobile) instead of the placeholder "324254". Logout clears the stored token in addition to resetting the in-memory preview state.
- `/settings/bank` (`BankAccount` in `src/components/settings/profile-forms.tsx`) is connected: `GET /api/providus/get-banks` loads the real bank list (deduplicated by name - Flutterwave's list has ~25 duplicate names with different codes), selecting a bank and typing a 10-digit account number auto-verifies via `POST /api/providus/get-account` and fills in the real, read-only account holder name, and `POST /api/providus/save-account` persists it. This matches `BankAccountDetailsScreen` on mobile, including that the account name field is never freely editable - only the backend-resolved name can be saved.

Social login and the dashboard/investment data (balances, plans, transactions) are still an interactive preview and not connected to the backend - only the identity shown (name/email) is real. Registration state (aside from the signup id/OTP needed to complete the flow) lives in `OnboardingProvider` and is cleared on reload. Password values are scoped to the password form and cleared on completion.

For accuracy, preview text replaces Figma claims that an SMS was sent, a BVN was fetched, or documents were encrypted and uploaded. The public-sector consent includes the Figma payroll clause; private-sector consent is adjusted to account registration.

## Design and verification

- Original Figma nodes: `1211:955`, `1211:1027`, `1211:1072`, `1211:1146`, `1211:1174`, `1211:1243`, `1211:1214`.
- Flexible widths and a one-column mobile details form avoid horizontal scrolling.
- Visible focus states, associated labels, native validation, accessible error/status messages, and keyboard OTP navigation support keyboard use.
- Playwright covers login feedback, password visibility, password reset feedback, image loading, registration validation, invalid OTP, invalid uploads, editing details, consent, password mismatch, route guards, and mobile overflow.

Framework setup follows the [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

## Dashboard and investment integration

Open `/dashboard` or choose **Explore dashboard preview** from login. Investment routes:

| Route                           | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `/dashboard`                    | Balances, active plans, products and recent transactions |
| `/investments`                  | SmallVest, Target Lock, Smart Lock and BNPL              |
| `/investments/[product]`        | Product information and benefits                         |
| `/investments/[product]/create` | Configuration, review, funding, one-time-code authorization and success |
| `/investments/active`           | Active plans and detail dialogs                          |
| `/transactions`                 | Searchable preview activity                              |
| `/settings`                     | Profile completion preview                               |

Product slugs are `smallvest`, `target-lock`, `smart-lock`, and `bnpl`. BNPL includes a six-item catalog and custom goals. The shared wizard preserves the draft when going back. Plans, funding and withdrawals are real backend calls (`POST /api/savings/*`). The web app has no transaction PIN (that is mobile-only): money actions are authorized with a one-time code. `POST /api/user/transaction-otp/request` (action `INVEST` or `WITHDRAW`, plus the amount) emails/SMSes a code and returns `otp_session_id`; the code and session id are then sent as `transaction_otp` and `otp_session_id` on the create, deposit, pending-deposit or withdraw call itself (`TransactionOtpForm`, `useTransactionOtp`, `TransactionAuth` in `src/lib/api.ts`). The backend verifies them there and only spends the code if the call succeeds, so a wrong code or failed transfer can be retried. A code is bound to its action and amount; an `INVEST` code covers a plan's create + fund pair, a `WITHDRAW` code one withdrawal. The backend only *requires* these when `TRANSACTION_AUTH_ENFORCED=true`.

Reusable primitives now also include `Modal`, `SegmentedControl`, `SummaryList`, `Callout`, `ProductCard`, `PlanCard`, and `TransactionRow`. All forms compose the shared `Button`, `Input`, `Select`, and `OtpInput` controls.

### Preview assumptions and checks

- Design nodes inspected: dashboard `1214:1392`, product list `1214:2515`, SmallVest `1214:2394`, Smart Lock `1214:2285`, Target Lock `1214:3455`, and the creation, catalog, review, funding, PIN, and success frames on the same page.
- The Figma connector reached its plan quota after dashboard and SmallVest extraction. Remaining screens were inspected in the public Figma browser. Catalog photographs are low-resolution crops of the original design; replace them with full-resolution exports when available. Exported vector assets and their source manifest are in `public/figma/`.
- Conflicting savings minimums in the design were normalized to the key-details value of ₦150,000. Dashboard total is calculated from its plan balances, and the empty-state text reflects the actual plan count.
- Savings estimates use simple annual interest over the selected months, less the design's 10% withholding assumption; future contributions are excluded. BNPL uses the design sample's 3.5% processing fee plus 5% monthly finance charge. These are illustrative calculations, not confirmed backend business rules.
- `npm run test:unit` (Node 22.6+) checks all three savings rates and the BNPL fee/payment calculation. Browser checks cover savings and BNPL completion, dashboard updates, desktop presentation, mobile navigation and overflow.

## Final account and activity screens

The final Figma section is integrated into the same workspace:

- `/investments/active` now includes the aggregate plan value. Plan cards open `/investments/active/[id]`, with product details, term progress, a withdrawal estimate, confirmation dialog, and success state.
- `/transactions` includes inflow/outflow/net totals, a proportional activity chart, month selection, search, Deposit/Withdrawal/Interest filters, and transaction statuses. Only completed entries contribute to totals.
- `/settings` is the account hub. `/settings/personal`, `/settings/bank`, `/settings/password`, `/settings/notifications`, and `/settings/close-account` implement the supplied forms and closure flow.
- Profile and bank changes and notification preferences live in `AccountProvider` for the current session. Profile names update across the dashboard, sidebar, and settings. Password changes are real (OTP-gated, then `POST /api/user/password/update`); the web app has no PIN settings.
- Withdrawal is a local simulation: it removes one preview plan and records one outgoing transaction. Its illustrative quote applies the design's 30% accrued-interest penalty and 10% withholding on the remainder. Backend eligibility, maturity rules and tax treatment are not implemented. Account closure walks through reason selection and the DELETE confirmation but does not delete any data or submit a request.
- New reusable controls include `Switch`, `RadioGroup`, `SettingsLayout`, `SuccessState`, and `PlanValue`; existing buttons, inputs, select controls, OTP fields, summary lists, and dialogs are reused.

Reference nodes: `1246:6021`, `1246:6128`, `1246:6328`, `1246:6527`, `1246:6726`, `1246:6960`, `1246:7302`, `1246:7394`, `1246:7461`, `1246:7500`, `1246:7113`, `1246:7147`, `1246:7208`, `1246:7269`, `1246:7252`. The Figma connector quota remained exhausted; these screens were inspected in the browser. Settings icons are crops of the original Figma artwork in `public/figma/settings/`.

Verification includes profile and notification updates, password mismatch and PIN validation, account-closure gating, withdrawal-to-dashboard/history updates, transaction filters and empty results. Unit tests cover withdrawal calculations and exclusion of pending/cancelled transactions from activity totals, alongside the existing product calculation tests.
