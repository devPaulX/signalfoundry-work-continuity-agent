// All names, organizations, tickets and events below are fictional demonstration material.
export const WORKSPACE = {
  id: 'atlas-service-pilot',
  name: 'Atlas Service Portal Pilot',
  organization: 'Northstar Operations · fictional',
  description: 'Reconstruct a launch handoff across planning, meetings, tasks and policy gates.',
  isSynthetic: true,
};

export const ARTIFACTS = [
  {
    id: 'SRC-01', kind: 'Project brief', title: 'Pilot charter · v1', date: '2026-10-12',
    content: `Atlas Service Portal Pilot — Project Charter (12 October 2026)\nGoal: pilot an AI-assisted internal support portal for 50 operations users.\nProposed pilot start: 24 October 2026. This is a target, not an approved launch date.\nDelivery owner: Maya Chen. Support readiness owner: Elena Brooks. Security owner: Priya Rao.\nRequired gates before a pilot can start: successful SSO validation and approved knowledge-base responses.\nThe pilot cannot proceed if either gate remains unverified.`,
  },
  {
    id: 'SRC-02', kind: 'Meeting notes', title: 'Readiness sync · 15 Oct', date: '2026-10-15',
    content: `Readiness sync, 15 October 2026 — attendees: Maya Chen, Priya Rao, Elena Brooks.\nDecision: retain 24 October as a planning target only; do not announce the start date until both release gates pass.\nElena Brooks will finish the support knowledge-base review by 21 October.\nPriya Rao will share SSO test results by 20 October.\nRisk: an authentication regression or incomplete KB review could delay the pilot.\nOpen question: who will approve the customer-support escalation roster? No owner assigned.`,
  },
  {
    id: 'SRC-03', kind: 'Task tracker', title: 'Launch tickets · 17 Oct', date: '2026-10-17',
    content: `Tickets exported 17 October 2026\nATLAS-142 — SSO integration: BLOCKED. Test failed with token refresh errors. Owner: Priya Rao. Retest target: 20 October 2026.\nATLAS-155 — Knowledge-base review: IN PROGRESS. 17 of 22 articles approved. Owner: Elena Brooks. Due: 21 October 2026.\nATLAS-168 — Pilot invitation email: READY but must not be sent before release approval. Owner: Maya Chen.\nATLAS-171 — Escalation roster: OWNER NOT ASSIGNED; decision required before pilot kickoff.`,
  },
  {
    id: 'SRC-04', kind: 'Operating procedure', title: 'Release gate SOP', date: '2026-10-10',
    content: `Northstar Operations — Pilot Release SOP, version 2.3\nGate 1: Security owner must record a passing SSO validation test. A staging patch is not a passing test.\nGate 2: Support readiness owner must approve all required knowledge-base content.\nGate 3: Delivery owner confirms escalation coverage and records explicit go/no-go approval.\nNo pilot invites may be sent, and no pilot may start, while any gate is incomplete or unknown.\nIf evidence conflicts, report the latest dated update but retain the blocking gate until verification is documented.`,
  },
  {
    id: 'SRC-05', kind: 'Engineering update', title: 'SSO remediation · 18 Oct', date: '2026-10-18',
    content: `Engineering update, 18 October 2026 at 09:30 UTC\nA patch addressing token refresh errors was deployed to staging.\nSSO regression retest has not yet been recorded. Priya Rao will conduct a retest on 20 October.\nThis update does not constitute security approval for the pilot.\nTicket ATLAS-142 stays BLOCKED until a passing test is documented.`,
  },
];
