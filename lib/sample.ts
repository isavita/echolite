export const SAMPLE_TRANSCRIPT = `Meeting: Sprint 24 Kickoff
Date: Monday, August 18
Participants: Alex (PM), Maya (Eng), Jordan (Design), Priya (QA), Liam (Data)

Alex: Goal today is to confirm the scope for Sprint 24 and unblock the API migration.
Maya: Backend is waiting on the auth library update; we can merge by Wednesday.
Jordan: Design tokens are ready; the new button states are final.
Priya: We'll need test data by Thursday to validate the reporting flow end-to-end.
Alex: Decision: move the release to August 26 to include the bugfixes from 1.3.2.

Maya: The crawler spike showed we can cut cold starts by ~30%.
Jordan: I’ll pair with Liam on charts legends; we saw confusion in the last study.
Alex: Sprint planning is on Wednesday at 10:00 AM CET, invite already sent.
Priya: Risk: flaky e2e tests on Firefox; I’ll work with Eng on stabilizing retries.
Liam: I own the dashboard SQL cleanup and ETL timing.

Action items:
- [Owner: Maya] Complete auth library update by Wed EOD.
- [Owner: Jordan] Update chart legends & hover states by Thu noon.
- [Owner: Priya] Stabilize Firefox e2e pipeline; report on pass rate Friday.
- [Owner: Liam] ETL timing fix and metrics audit by Thu 5 PM.

Alex: Anything else? If not, let’s wrap.`;
