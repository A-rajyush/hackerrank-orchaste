# Project Plan: Ghost Data Still Exists

**Status**: Approved
**Created**: 2026-10-25
**Mode**: Local browser-only application

## 1. Project Overview

Create a browser-only CSV dashboard for reviewing the supplied `dataset/deletion_requests.csv`. A user chooses the CSV from their local device; parsing, filtering, and summaries run in the browser. The application has no backend, cloud dependency, authentication, or database.

The available CSV contains 518 records and these columns: `audit_at`, `case_id`, `email`, `reported_at`, `reported_status`, `requested_at`, and `request_text`. It is the only challenge input currently present.

## 2. Goals, Scope & Constraints

### Goals
- Make the provided deletion-request records easy to inspect using search, filters, and descriptive summaries.
- Clearly distinguish fields reported by the CSV from facts verified against an authoritative source.
- Keep the data local to the browser session.

### In scope
- User-selected CSV import and validation.
- Dashboard summaries, filter controls, and a sortable/searchable record table.
- Clear messaging for incomplete evidence and unverified status.
- Responsive, keyboard-accessible browser UI.

### Out of scope and constraints
- No backend, cloud resources, sign-in, database, server-side upload, or persistent storage.
- No fabricated or inferred audit/compliance verdicts, deletion outcomes, or “ghost data” classifications.
- `audit_claims=false`: do not present audit conclusions or imply that an audit was performed.
- The workspace contains no challenge policy, source-system exports, ground truth, or audit rules. Compliance must remain **Unevaluated**; every `reported_status` value must be presented as **Unverified (source-reported)** until policy and supporting evidence are available.
- Do not infer meaning from `audit_at` or other timestamps beyond displaying the literal source values and computing clearly labeled descriptive counts.
- Do not send CSV contents to telemetry, logs, external APIs, or any network service.

## 3. Architecture

- **Application type**: Frontend-only single-page application.
- **Frontend**: React with TypeScript (planning default; requirements file records these as inferred selections).
- **Execution**: Static client application served as local web assets. CSV parsing, validation, filtering, and aggregation execute in the browser.
- **Data flow**: User file picker → in-memory CSV parser → schema/row validation → in-memory dashboard state → summaries and records. No upload or persistence path.
- **State lifecycle**: Keep imported records in memory only; provide a clear/reset action that removes the selected data from application state. Reloading or closing the page ends the session.
- **Parsing**: Use a maintained CSV parser that handles quoted fields, commas, escaped quotes, and UTF-8. Treat values as untrusted text; render them as text, never as HTML.
- **Failure handling**: Show actionable messages for missing file, unreadable or malformed CSV, missing expected columns, and empty data. Do not silently coerce invalid values into conclusions.
- **Storage and identity**: No datastore required; no user accounts or authentication.

## 4. Data & Processing

### Input contract

Expected columns: `case_id`, `email`, `requested_at`, `reported_at`, `reported_status`, `audit_at`, and `request_text`. Preserve source values as strings unless a display-only formatting operation is safe. Missing or extra columns must be reported to the user; do not invent replacement values.

### Derived dashboard values

- Total number of parsed rows.
- Counts and proportions grouped by the literal `reported_status` values, labeled as source-reported and unverified.
- Counts by date only when the relevant source value parses unambiguously; otherwise retain it as an unparsed source value.
- Filtered row count and the currently applied filters.

These are descriptive calculations over the uploaded CSV only. They are not evidence of deletion, compliance, audit completion, or record absence.

### Privacy

Email addresses and request text may contain personal or sensitive information. Keep them in memory only, avoid logging them, and mask email addresses in the default table view; offer an explicit per-session reveal control if detailed review is needed. The user can clear imported data at any time. Explain that the file is processed locally in the browser.

## 5. Features & User Flows

1. **Import**: User selects a CSV. The dashboard explains local processing and validates its header and records.
2. **Review overview**: Show total imported records, record counts by source-reported status, and a persistent notice: “Compliance: Unevaluated. Reported status: Unverified.”
3. **Explore records**: Search across non-sensitive record fields, filter by literal reported status and available date values, sort columns, and paginate or virtualize the table.
4. **Inspect a record**: Show the source values for the selected row, retaining clear labels that values come from the CSV and are not independently verified. Mask email by default.
5. **Reset**: Clear the selected file and all in-memory records, returning to the import state.
6. **Handle unsupported or malformed input**: Explain missing required columns or row parsing issues; allow the user to select another file. Never show a compliance verdict as a fallback.

## 6. Design System & UI

**Component Library**: Fluent UI v9

- Use a restrained dashboard layout: page header and evidence disclaimer, import panel, summary cards, filter/search toolbar, and records table.
- Keep the “Compliance: Unevaluated” and “Reported status: Unverified” labels visible in the overview and record-detail experience; do not rely on color alone.
- Use explicit source labels such as “CSV-reported status” and “Source value”; avoid verdict-like labels such as pass, fail, compliant, deleted, or ghost.
- Provide empty, loading, validation-error, and populated states.
- Support keyboard navigation, visible focus, semantic headings/table markup, screen-reader labels, and responsive layouts.

## 7. Security, Privacy & Operational Constraints

- The app must not make network requests containing imported data.
- Do not persist data in local storage, IndexedDB, cookies, service-worker caches, or browser URL state.
- Render all imported values as escaped text to prevent CSV content from becoming executable markup.
- Avoid retaining or emitting raw CSV values in logs, error reports, or analytics.
- The app is informational only. It does not determine compliance, validate deletion, or replace policy review or source-system investigation.
- No Azure resources are planned or required.

## 8. Acceptance Criteria

- A user can select the supplied CSV and see a dashboard with its records and descriptive counts.
- The dashboard exposes search, status/date filtering where values are usable, sorting, and record inspection.
- The imported record count reflects the parsed rows; malformed rows or missing required headers are surfaced clearly.
- Every displayed `reported_status` is explicitly marked unverified/source-reported.
- The dashboard visibly states compliance is unevaluated and makes no audit, compliance, deletion, or ghost-data verdict.
- No verdict is generated from `audit_at`, timestamps, status labels, or aggregate counts.
- Email values are masked by default and can be revealed only through a clear, session-local user action.
- Selecting reset clears all imported records and derived dashboard state; refreshing or closing the app does not restore uploaded data.
- The application makes no network request with CSV contents and uses no backend, cloud service, authentication, or database.
- Core import, filtering, table, and reset flows are keyboard accessible and usable at narrow viewport widths.
