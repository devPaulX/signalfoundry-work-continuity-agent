# Submission release gate — complete with evidence

## 1. Build and cloud

- [ ] In Cloud Shell: `node --version` and `gcloud config get-value project` match chosen project.
- [ ] Billing is active, necessary APIs enabled, correct Firebase project selected.
- [ ] Firestore `(default)` exists in Native mode, restrictive browser rules deployed.
- [ ] Cloud Run `signalfoundry-api` deployed in `asia-south1` with a dedicated service identity.
- [ ] Cloud Run identity has `roles/datastore.user` and `roles/aiplatform.user`.
- [ ] `curl -fsS "${RUN_URL}/api/health"` returns JSON with `"status":"ok"`.
- [ ] `curl -fsS "https://${PROJECT_ID}.web.app/api/health"` returns the same.

## 2. Real end-to-end

- [ ] Open Firebase Hosting URL in a new private window.
- [ ] Verify five fictional artifacts, including SOP and blocked SSO ticket.
- [ ] Click Generate; confirm populated structured brief and source badges.
- [ ] Confirm Cloud Run logs have no Vertex API or Firestore errors.
- [ ] Check a Gemini inference request was actually made, not mocked; model name appears in the result metadata.
- [ ] Click source badges and inspect the corresponding text; unsupported information must not be presented as verified.
- [ ] Reload; confirm “Restored from Firestore” and matching saved timestamp.
- [ ] Optional: enter fictional progress text, save, regenerate; verify six sources and a newer snapshot.
- [ ] Test a fresh private window separately; it should start a distinct anonymous session.

## 3. Repository and content

- [ ] `git status` clean, only synthetic artifacts, and `.env*`, credentials, keys absent from tracked files.
- [ ] GitHub repository is Public and opens in an unauthenticated browser.
- [ ] README honestly describes deployed behavior and limitations.
- [ ] Official participant-dashboard deck template used; no template substitutions.
- [ ] PDF export is <=5 MB; screenshots from real deployed browser.
- [ ] Real demo recording 3–4 minutes, link opens in private window.
- [ ] Solution description mentions Firebase Hosting, Firestore, Cloud Run and Gemini accurately.
- [ ] Challenge selected: Future of Work & Enterprise Productivity.
- [ ] All prototype, GitHub, PDF and video links checked; form submitted before 23:59 IST on 2026-10-18.
- [ ] Submission confirmation ID or screenshot retained.
