# Live demonstration script — target 3 minutes 35 seconds

**Prerequisite:** Record the publicly deployed, functional browser application. Do not animate mocked results or claim untested infrastructure. If the live workflow fails, fix it before recording.

**0:00–0:25 | Work fragmentation**

“Meetings capture decisions, issue trackers capture blockers, and procedures define release gates. The next person taking over work needs a reliable operational handoff, not yet another disconnected summary. SignalFoundry reconstructs the latest state and shows its sources.”

**0:25–0:55 | Five synthetic artifacts**

Open the Firebase-hosted URL. Point to the fictional Atlas Service Portal Pilot workspace. Expand the charter, tickets and SOP. Say: “All records are synthetic. The charter targets October 24, while the ticket shows SSO testing blocked; the SOP requires sign-off.”

**0:55–1:35 | Generate live with Gemini**

Click **Generate work brief**. Do not edit the response or skip over errors. Wait for actual results to appear. Say: “The Cloud Run backend loads the source records from Firestore, asks Gemini for a structured handoff, then checks citations before saving the snapshot.”

**1:35–2:30 | Evidence and operational insight**

Inspect current status, a decision, an action and at least one blocker. Click a source-evidence chip and show the corresponding record. Explain that a patch being in staging does not mean a passing security retest. If status differs from expectations, discuss only what the application actually displayed.

**2:30–3:02 | Persistence**

Reload the browser. Point to **Restored from Firestore** and the snapshot. Optionally add a short synthetic update, save it, and generate again only if the deployed update path is reliable. If generation consumes too much runtime for the time slot, demonstrate just reload and retrieval.

**3:02–3:27 | Infrastructure**

Explain: “Firebase Hosting serves the browser. Cloud Run orchestrates and validates. Firestore persists input records and saved snapshots. Gemini on Vertex AI performs structured evidence-driven synthesis.”

**3:27–3:35 | Closing**

“SignalFoundry makes fragmented work easier to hand off with inspectable evidence. This is a synthetic, anonymous prototype—not a production enterprise connector.”

**Recording requirements:** 3–4 minutes per dashboard requirements; English narration or captions; publicly viewable in an incognito session; show the real HTTPS URL in the address bar. Use actual timings, not assumed runtime performance.
