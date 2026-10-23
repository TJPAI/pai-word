# PAI Word V2.2 — durability and deployment isolation QA

## Verified source findings (2026-10-24)
- `rebuild-preview/ku-durable-store.js` opens IndexedDB `pai-word-ku-durable-v1` (schema 3).
- The same database stores the KU snapshot, committed attempt IDs, settings, and home state in separate stores.
- `commit()` checks attempt ID and expected snapshot version in one readwrite transaction covering `state` and `attempts`.
- The app's `commitRatedDraft()` updates in-memory state only after a successful IndexedDB transaction.
- `bootstrap.js` exposes a destructive test reset that deletes `pai-word-ku-durable-v1` and matching localStorage keys.

## High priority: GitHub Pages origin sharing
Browser storage is scoped by origin, NOT by path. If the production and preview URLs both use `https://tjpai.github.io`, the path difference does not isolate IndexedDB or localStorage. Do not use the destructive reset on either site until the deployment storage ownership has been established.

**Do not blindly rename the existing DB**: existing learning records would no longer be loaded without migration. A safe solution needs a versioned environment namespace, read-only legacy inspection, user-approved migration policy, and a rollback/export path. For truly independent QA, use a different origin (subdomain or separate hostname) rather than relying only on different paths.

## Next tests — not yet executed
1. **Two tabs:** start at version N in both tabs, commit in A, then commit in B. Expect B conflict, never overwrite A.
2. **Duplicate attempt:** commit the same attempt ID twice; expect only one increment.
3. **Forced transaction abort:** force an IndexedDB transaction failure; expect no snapshot mutation and no attempt record.
4. **Reload after commit:** refresh immediately after commit; expect one rating and correct visible KU.
5. **Interleaved swipes:** during rating countdown, alternate left/right and up/down; expect one rating and one final navigation.
6. **Production vs preview:** inspect origins and database names, then confirm that reset and storage writes are not shared.
7. **Safari first speech:** check fresh scene, bookmark resume, and explicit speaker tap independently from rating.

## QA evidence rules
- A static source assertion is not an executed IndexedDB transaction test.
- A successful commit is not proof that a GitHub Pages deployment is updated.
- User-confirmed normal interaction is evidence for that session, not a substitute for multi-tab or storage failure tests.
- Do not modify `main` or change the established three-button UI/audio/SRS behavior for these tests.
