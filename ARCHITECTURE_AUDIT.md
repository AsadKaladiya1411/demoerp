# ERP Architecture Audit

Audit date: 2026-08-10

## System map

- Frontend: React 19, Vite, React Router, Tailwind/Radix, one authenticated ERP context.
- Backend: Express, JWT authentication, role-authorized state routes, JSON file persistence.
- Persistence contract: authenticated snapshot reads and atomic record-level operation batches.
- Core flow: masters -> recipe/production calculation -> RM/PM requirement -> purchase -> goods receipt -> QA -> production issue/return -> reports.
- R&D flow: sample requirement -> purchase/dispatch -> sample receipt/inventory -> base formula -> trial -> assessment -> formula library/reports.

## Critical findings

| Finding | Impact | Resolution |
|---|---|---|
| Whole-array PUT effects ran independently for every collection | Concurrent users could erase each other's records | Replaced by one debounced record-diff batch and serialized atomic backend application |
| R&D, dispatch, receipt, trial, and formula stores were module-level arrays | Records disappeared on refresh and were invisible to other browsers | Migrated all business collections into the authenticated backend snapshot |
| Stored tokens were trusted without server validation | Expired tokens could hydrate an empty UI and trigger destructive synchronization | Added `/api/session`; synchronization cannot start until the token is verified and snapshot hydration succeeds |
| Authorization existed only in React | Any authenticated token could mutate any collection | Added backend collection-level write authorization and 403 enforcement |

## High findings

| Finding | Impact | Resolution |
|---|---|---|
| Per-item POSTs and collection PUTs duplicated writes | Races, duplicate requests, inconsistent failures | Removed duplicate frontend calls and bulk replacement endpoint |
| Multi-collection inventory writes were separate network requests | Partial goods receipt/QA/issue state | Related React updates are diffed into a single backend operation batch |
| Employee A pending receipt page had no route/navigation | Sample workflow could not be completed | Added the protected route and existing page to Employee A navigation |
| Frontend and backend user lists differed | R&D login/session mismatch | Aligned public user identities and removed credentials from the frontend bundle |
| File mutations were not serialized | Parallel requests could lose writes | Added a backend write queue around all state operations |
| Express async route failures were not forwarded | Rejected promises could terminate or hang requests | Added async route wrapping and centralized JSON error handling |

## Medium findings

| Finding | Resolution |
|---|---|
| API calls and token parsing were duplicated | Centralized authenticated Axios request handling |
| API payloads could contain missing nested arrays | Snapshot normalization now guarantees recipe ingredients, R&D ingredients/history, vendor arrays/documents, and all top-level arrays |
| Unknown frontend URLs rendered no route | Added a catch-all redirect into the protected routing flow |
| Dead Prisma/Postgres scaffolding contradicted the file backend | Removed unused Prisma source/dependencies and simplified Docker persistence |
| CORS was unrestricted and production could use a fallback JWT secret | Added configured origins and production JWT-secret validation |

## Low findings and retained constraints

- Large production bundle warning remains an optimization opportunity; it does not affect correctness.
- Fast-refresh lint warnings remain in shared component/context modules; builds and TypeScript are clean.
- The current demo intentionally uses JSON file storage and hardcoded backend demo credentials. It is suitable for the current single-instance demo, not horizontal multi-process deployment.
- Existing UI calculations, labels, forms, report layouts, and business decisions were preserved.

## Data ownership rules

1. Authentication session metadata is the only localStorage data.
2. All ERP business records are loaded from `/api/state/snapshot`.
3. Every business mutation becomes an `upsert`, `delete`, or approved singleton `set` operation.
4. A batch is applied against the latest server state, so unrelated records from another user are preserved.
5. Focus refresh and periodic refresh make remote changes visible without a page reload.
6. Failed writes reload the authoritative server snapshot instead of retaining divergent client state.
