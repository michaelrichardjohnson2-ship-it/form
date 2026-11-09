# Form — private cloud sync on Netlify

This version uses Netlify Functions and Netlify Blobs. There is no separate database account or server to maintain. The same private JSON record file is available from every device after signing in with your Form password.

## One-time setup

This is a source package with server functions, not the earlier static drag-and-drop ZIP. Deploy it through Netlify CLI or a connected Git repository so the functions are included.

1. Extract this package and open a terminal in the extracted folder.
2. Run `npm ci`.
3. Run `npx netlify login` and complete Netlify's browser sign-in.
4. Run `npx netlify link` to select your existing Form site. If you have not deployed it yet, create a new site in Netlify, then link it. Do not select your main website unless you intend to replace it.
5. In that site's Netlify dashboard, open Project configuration → Environment variables. Add `FORM_PASSWORD` with a unique password of at least 16 characters (a password manager-generated password is best). Give it Functions/runtime scope and the Production context. Do not use a VITE_ prefix. Do not put this password in code or send it in chat.
6. Run `npm run deploy`.
7. Open the live site on each device and sign in using the same Form password.

Your domain can be connected later without changing the app. Use the same Netlify site to preserve the cloud records. Each new domain requires signing in again.

## Existing entries

The old device-only package can export a JSON backup under Data & backups. In the cloud version, sign in and import that backup. Imported entries are synced after 30 seconds. Import merges records, with imported values winning on matching dates/habits.

If you update the same URL in the same browser, the cloud version offers to move committed local entries from the old version. For maximum certainty, export a backup from the old version before switching, including any pending changes.

The earlier ChatGPT-hosted app has a separate database. It is not copied automatically. No user records or credentials are included in this source package.

## Behaviour

- Immediate local updates; cloud sync 30 seconds after the last edit.
- Pending changes are recovered after a refresh or reopening the same browser.
- Other devices' updates are checked every 30 seconds while the page is visible, and when the window regains focus.
- One site-wide Netlify Blobs store, `form-private`, with `records.json`. New deploys of the same site retain it.
- Concurrent updates are merged with conditional writes. When two devices edit the same cell, the last successful update wins.
- Password sign-in with a secure HttpOnly cookie lasting 30 days. Changing FORM_PASSWORD and redeploying invalidates existing sessions.
- Only the app shell is public. Reading and writing records requires a valid session. Sign-in requests are rate-limited by Netlify.
- This is a single-person tracker, not a multiple-user application.
- Backups are available in the app. Keep exported backups private.

## Checks

`npm test` runs authentication, validation and concurrent-write tests. `npm run build` builds the frontend. Netlify builds the server functions during deployment.

Cloud hosting usage is charged according to your Netlify plan. The app requires Functions and Blobs to be enabled. It cannot provide cross-device sync from a static-only upload.
