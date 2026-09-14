# XEROXMATE Landing Page

Premium dark-themed launch landing page for **XEROXMATE** (smart printing partner & network),
built with React + Vite + Tailwind CSS. Launch: **Wednesday, September 16, 2026, 7:00 PM IST**.

Page flow: Navbar → Hero (launch countdown) → ProofStrip → HowItWorks →
InteractiveSimulator → FeatureBento → ComparisonSection → **launch-notification
contact card** (`src/components/ConductCard.tsx`) → Footer.

## Local development

```powershell
npm install
npm run dev      # Vite on http://localhost:3000
npm run lint     # typecheck (tsc --noEmit)
npm run build    # production build
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_APPS_SCRIPT_URL` | Yes (for the form) | Public Google Apps Script Web App URL that receives launch-list signups. Not a secret — only an endpoint. |
| `GEMINI_API_KEY` | No | Legacy AI Studio variable, unrelated to the contact form. |
| `APP_URL` | No | Legacy AI Studio variable, unrelated to the contact form. |

Setup:

1. Copy `.env.example` to `.env.local` (git-ignored).
2. Set `VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`.
3. Restart the Vite dev server after changing env vars.

`.env`, `.env.local`, and other local env files are git-ignored (see `.gitignore`);
only `.env.example` (placeholder values) is committed.

## Launch-list architecture

```
React/Vite frontend (src/components/ConductCard.tsx, src/lib/contact.ts)
        ↓  POST JSON as text/plain (simple request, no CORS preflight)
Google Apps Script Web App (google-apps-script/Code.gs)
        ↓  appendRow with server-side timestamp
Private Google Sheet (tab "Contacts": Timestamp | Name | Email)
```

- Visitors only ever see a generic success message (`✓ You're on the list!`).
  The form never renders submitted names/emails, subscriber counts, sheet data,
  sheet URLs, or Google account info.
- Never put Google service-account keys, OAuth secrets, API keys, or spreadsheet
  credentials in frontend code. Only the public Web App URL lives in `VITE_GOOGLE_APPS_SCRIPT_URL`.
- The endpoint is write-only: `doGet` returns an error and there is no list/read API.

## Google Sheet creation

1. Create a new Google Sheet (e.g. "XEROXMATE Launch List").
2. Rename/create a tab named `Contacts`.
3. Put this header row in `A1:C1`: `Timestamp | Name | Email`.
4. Keep the Sheet's sharing set to **Restricted / private** (only you). Do not share it publicly.

## Google Apps Script setup & deployment

1. In the Sheet: **Extensions → Apps Script**.
2. Replace the default file with the contents of `google-apps-script/Code.gs`.
3. Open **Project Settings (gear icon) → Script Properties** and add:
   - `SPREADSHEET_ID` = the long ID from your Sheet URL
     (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`)
   - `SHEET_NAME` = `Contacts` (optional; defaults to `Contacts`)
4. **Deploy → New deployment → Web app**:
   - Description: e.g. `XEROXMATE launch list v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize with your Google account, and copy the **Web App URL**
   (`https://script.google.com/macros/s/.../exec`).
6. Put it in `.env.local` as `VITE_GOOGLE_APPS_SCRIPT_URL=...` and restart Vite.
7. If you later edit the script, **Deploy → Manage deployments → Edit → New version**
   so the live URL picks up the changes.

## Testing a submission

1. Run `npm run dev` with `VITE_GOOGLE_APPS_SCRIPT_URL` set.
2. Scroll to the contact card above the footer.
3. Submit a name + valid email → expect `✓ You're on the list!` with no echoed data.
4. Check the `Contacts` tab: a new row `Timestamp | Name | Email` with a server-generated timestamp.
5. Re-submit the same email → still shows success, no duplicate row (`alreadyRegistered`).
6. Validation: empty name/email, malformed email, and over-length input are rejected on
   both client and server. Honeypot field `website` must stay empty for real users.
7. Failure path: stop the network or use a bad URL → `Something went wrong. Please try again.`
   with the form left usable for retry. No backend internals are shown.

Note: until you deploy the Apps Script and set the env var, the form shows a generic
error (plus a dev-only config hint when running `npm run dev`). No fake success is ever shown.

## Security notes

- Sheet stays private; only the Apps Script (running as you) can write to it.
- Server validates + trims + length-checks (name ≤ 100, email ≤ 254), normalizes email
  to lowercase for dedupe, rejects malformed input, and generates the timestamp itself.
- Hidden honeypot field `website` silently accepts (without storing) bot submissions.
- Duplicate emails return `{ success: true, alreadyRegistered: true }` so ownership
  cannot be probed.
- Only `Timestamp | Name | Email` are stored — no IPs, user agents, or tracking data.

## Project structure (relevant files)

- `src/components/ConductCard.tsx` — launch-notification card (Name + Email + honeypot,
  loading/success/error states), placed between the final content section and `Footer`.
- `src/lib/contact.ts` — endpoint config, validation, and `fetch` submission helper.
- `google-apps-script/Code.gs` — Apps Script backend (`doPost`/`doGet`, validation,
  dedupe, honeypot, server timestamp).
- `.env.example` — documents `VITE_GOOGLE_APPS_SCRIPT_URL`.
- Legacy/unused by the new flow: `src/lib/firebase.ts`, `src/lib/sheetsService.ts`
  (OAuth/localStorage flow) remain in the repo but are no longer imported by the form.
