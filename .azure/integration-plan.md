# Integration hand-off

- **Application**: `services/web` from the generic integration workflow is not used. This workspace is a single-root Vite frontend (`src/`).
- **Backend**: None. There is no server process, backend build, or health endpoint.
- **Frontend**: project root; `npm run dev`; `npm run build`; `npm test`.
- **Data seam**: `src/csv.ts` parses the user-selected `File` locally; `src/App.tsx` owns ephemeral session state. Do not replace this with a live API or add upload/persistence.
- **Mock data**: None. No mock client, mock datasets, duplicated API types, or preview-state switcher to remove.
- **API routes**: None.
- **Database**: None; no schema or migration tool/directory; no connection environment variables. **Do not add seed data.**
- **Shared types/client**: No shared package or typed API client is required.
- **Services**: Frontend only — Essential. There are no Enhancement services.
- **Safety boundary**: Keep reported values labeled unverified; compliance unevaluated. Do not infer audit, deletion, or compliance outcomes. No CSV content may be transmitted or persisted.
