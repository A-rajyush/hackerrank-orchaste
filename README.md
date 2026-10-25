# Request Ledger

A local, browser-only CSV dashboard for reviewing deletion-request records. The app has no backend, account system, database, cloud resource, or analytics integration. It does not decide whether a deletion occurred or assess compliance.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`) and select a CSV from your device. The supplied challenge file is `dataset/deletion_requests.csv`. The app checks the required header, supports quoted CSV fields, then keeps parsed values in browser memory for the current page session.

```powershell
npm test
npm run build
```

## Publish to GitHub Pages

The repository includes a GitHub Actions workflow that builds the site and publishes `dist/` to GitHub Pages when changes are pushed to `main` or `master`.

1. In the GitHub repository, open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Push the project to `main` or `master`, or run the **Deploy to GitHub Pages** workflow from the **Actions** tab.
4. Open the Pages URL shown in the workflow deployment. The Vite build uses relative asset paths so it can run under a repository subpath.

## Data and privacy

- The file is read with the browser's local `File` API and parsed in memory.
- There are no upload, API, telemetry, logging, or persistence paths. No CSV data is sent over the network or saved to browser storage.
- Reloading or closing the page clears the imported data. **Clear file** resets the current session immediately.
- Email addresses are masked by default. The session-only reveal control does not save the choice.
- Imported content is rendered as text, not HTML. Search excludes email and request-text fields.
- The supplied `reported_status` values are source-reported and **Unverified**. Compliance is **Unevaluated**. No audit, deletion, or “ghost data” conclusions are made.

The interface is informational only. Validate any investigation against applicable policy and authoritative source-system evidence.
