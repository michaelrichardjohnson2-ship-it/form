# Form — password-free cloud sync

One shared tracker. Anyone with the site address can view and edit the same records. No login or environment variables are needed. Netlify Functions and Blobs provide cloud storage.

## Update your existing Netlify site through GitHub

1. Unzip the package. Open the form-cloud folder.
2. In your GitHub repository, open the existing form-cloud folder. Choose Add file → Upload files. Drag the CONTENTS of the extracted form-cloud folder in, including its subfolders, then commit changes. Do not nest another form-cloud folder inside it.
3. Your connected Netlify project will rebuild automatically. Use the SAME Netlify project to keep existing cloud records.
4. Open the site: Form now loads immediately without a password. An existing FORM_PASSWORD environment variable is ignored and can be removed.

For a new Netlify project imported from GitHub:
- Base directory: form-cloud
- Build command: npm run build
- Publish directory: dist (relative to the base directory)
- Functions directory: netlify/functions (relative to the base directory)

This is a source package including server functions. Do not use Netlify's static drag-and-drop upload for this package.

## iPhone

Open the final site address in Safari → Share → Add to Home Screen → Form → Add. The package includes a white F and green dot icon on black. Remove and re-add an old shortcut to refresh its icon. No offline mode is provided.

## Sync and existing data

Edits appear instantly; cloud saves happen 30 seconds after your last edit. Pending edits stay on the device until synced. Other devices refresh every 30 seconds while visible and on focus.

The store name remains form-private, with records.json, so updating the same Netlify project retains its records. Despite the legacy store name, this version exposes records through the public app API. Concurrent writes merge; the last successful write wins for the same cell.

Use Data & backups to export/import earlier device-only or ChatGPT-hosted records. Those separate records are not transferred automatically. Import merges records and syncs after 30 seconds. No personal records are included in this package.

## Local checks and deployment

npm ci
npm test
npm run build

Alternatively, run npx netlify login, npx netlify link to select your existing project, then npm run deploy. Netlify builds the functions during deployment. Usage depends on your Netlify plan.
