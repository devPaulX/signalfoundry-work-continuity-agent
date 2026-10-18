# Submission description — paste after production verification

**Product:** SignalFoundry — Work Continuity Agent  
**Challenge:** Future of Work & Enterprise Productivity

## One-paragraph description

SignalFoundry transforms fragmented enterprise work artifacts into evidence-backed operational handoffs. The prototype uses fictional project plans, meeting notes, tickets and procedures to reconstruct current status, decisions, actions, blockers, dependencies and unresolved questions. Gemini generates a structured work brief; the backend verifies cited source IDs and supporting quotations, excludes unsupported claims and preserves unknowns. Users inspect references in the browser and restore saved snapshots, making the handoff traceable rather than merely summarized.

## Technology field

**Firebase Hosting** serves the public frontend and proxies API traffic to Cloud Run; **Firestore** stores synthetic source records, optional user-supplied demo updates and generated snapshots; **Cloud Run** hosts the Node.js API that orchestrates workflows, performs source validation and persists briefs; **Gemini 2.5 Flash** on Vertex AI synthesizes structured work states using source evidence. The backend uses application-default credentials rather than client-exposed API keys.

## Differentiator field

Source-backed work-state reconstruction across artifacts with chronological context, explicit evidence references, literal quote validation and unknown-state handling. In the fictional pilot example, a staging security patch does not count as release approval.

## Limitation field

The prototype uses synthetic data and anonymous demo sessions. It does not integrate with production project tools, does not provide enterprise authentication, and cannot independently guarantee that every model paraphrase is semantically entailed by a matching quotation.

## Required URLs (fill in only when publicly verified)

- Prototype: [ACTUAL FIREBASE HOSTING URL]
- Repository: [ACTUAL PUBLIC GITHUB URL]
- Video: [ACTUAL PUBLIC 3–4 MIN DEMONSTRATION URL]
- Pitch PDF: [PDF EXPORTED FROM OFFICIAL TEMPLATE, <= 5 MB]
