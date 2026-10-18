# AI Builder Cup 2026 — prescribed deck CONTENT ONLY

**Required:** Obtain the actual pitch deck template from the participant dashboard. Paste this text into the matching template slide layouts, add actual deployed-app screenshots, then export a PDF of **no more than 5 MB**. This Markdown file is not a substitute for the official template.

## Slide 1 — Cover

**SignalFoundry**

Work Continuity Agent

Evidence-backed handoffs from fragmented work.

Challenge: **Future of Work & Enterprise Productivity**

Team: **SignalFoundry**

## Slide 2 — The problem

**Critical context gets lost between tools and people.**

- Status sits in project briefs.
- Decisions sit in meeting notes.
- Ownership and blockers sit in tickets.
- Readiness gates sit in operating procedures.

When a teammate takes over, they manually reconstruct what changed, what is blocked and which claims can be trusted.

## Slide 3 — The solution

**Not just a summary. A traceable work-state reconstruction.**

SignalFoundry produces one operational handoff containing current status, decisions, action items, owners, due dates, dependencies, blockers and open questions. Each supported claim carries a traceable source ID and quotation. Claims with invalid evidence are excluded; unverified information is labeled unknown.

Use an actual screenshot of the source list beside the generated brief **after the live build is verified**.

## Slide 4 — Architecture

**Google Cloud-native vertical slice**

Browser → Firebase Hosting → Cloud Run API → Firestore artifacts → Gemini on Vertex AI → Evidence validator → Firestore snapshots → Browser

- **Firebase Hosting:** accessible frontend and same-origin Cloud Run rewrite.
- **Cloud Run:** orchestration, input checks, evidence validation, HTTP endpoints.
- **Firestore:** synthetic documents, browser-session updates, saved briefs.
- **Gemini:** cross-artifact structured synthesis with JSON output.

No embedded API keys; calls use Cloud Run's service identity.

## Slide 5 — Product demonstration

**Pilot readiness shows why provenance matters.**

The fictional project charter targets an October 24 pilot. An October 18 engineering update reports a staging fix, **not a passing SSO retest**. The release SOP prohibits invitations before security, knowledge-base and escalation gates are approved. SignalFoundry should preserve the blocking status rather than incorrectly declare launch readiness.

Place a real screen capture showing that work state and click-through source evidence. Include a saved snapshot view, only after verified in production.

## Slide 6 — Differentiation and impact

**Traceability over confident-sounding summarization.**

- Cross-artifact reconciliation across different record types and dates.
- Exact quoted evidence tied to source IDs.
- Unsupported quotes rejected; unknown data remains unknown.
- Stored, retrievable handoff snapshots for continuity.
- Synthetic, credential-free demonstration for reviewers.

**Impact:** helps a receiving colleague see what is known, what is blocked, what must be done and where the evidence lives. Do not claim measured time saved without a real study.

## Slide 7 — Feasibility, limitations and next step

**Built for practical evaluation.**

Current demonstrated scope **(confirm each before finalizing):** five fictional records, Gemini extraction, evidence-checked sections, Firestore persistence, update-and-regenerate, Firebase/Cloud Run deployment.

**Limitations:** no live third-party integrations; no enterprise authentication or tenant isolation; quoted evidence does not prove semantic truth; anonymous demo is not production-ready.

**Next:** authenticated workspaces, connectors, conflict-specific provenance, human review, production-grade quota controls.

Link to verified public demo, repository and video.

## Slide-by-slide QA

- Use the dashboard-provided deck template, not a newly created design.
- Replace all bracketed placeholders only with verified links or screenshots.
- Check the exported PDF size is 5 MB or less.
- Distinguish implemented behavior from roadmap.
- Never insert fabricated metrics, fabricated customer logos or unreal deployment status.
