# Deploy the inspected source through Cloud Shell

Local verification: `npm.cmd test` on Node v24.14.0 passed all four existing tests (0 failed, skipped, or cancelled). JavaScript syntax and Bash syntax checks passed. The HTTP route test injects an in-memory store and a fake model. These results do not verify Google services. Cloud Run uses Node 22 from the Dockerfile; the commands below rerun tests on Cloud Shell's installed Node before deployment.

## Upload and authenticate

Upload `signalfoundry-upload.tar.gz` using **More > Upload** at <https://shell.cloud.google.com/>. The archive contains the inspected source, deployment scripts, and documentation; no credentials or dependencies. No local Google Cloud CLI is needed.

In Cloud Shell, paste this block, replacing the project ID. Cloud Shell normally supplies Google Cloud CLI authentication: approve its authorization prompt. If `gcloud auth list` shows no active account, run `gcloud auth login --no-launch-browser` and follow its instructions. Do not create or upload service-account keys; local Application Default Credentials are not required for this deployment.

```bash
export PROJECT_ID='YOUR_ACTUAL_GOOGLE_CLOUD_PROJECT_ID'
gcloud auth list
gcloud config set project "$PROJECT_ID"
gcloud projects describe "$PROJECT_ID" --format='table(projectId,name,projectNumber)'
gcloud billing projects describe "$PROJECT_ID"
command -v firebase >/dev/null || npm install -g firebase-tools
firebase login --no-localhost
firebase projects:list
```

Billing must be enabled. If this project is absent from the Firebase list, open <https://console.firebase.google.com/>, add Firebase to **the same existing Google Cloud project**, and accept the terms. Initialize Firebase Hosting if needed. The script expects the default Hosting site ID to equal the project ID and checks that before provisioning. Both CLI identities must have access to the chosen project. The deploying identity needs API enablement, service-account creation/impersonation, project IAM changes, Cloud Run source deployment, Firestore creation if absent, and Firebase deployment permissions. Organization policies may prevent public Cloud Run access; do not disable those policies to make the script pass.

## Extract, check, and deploy

This uses a fresh directory to avoid overwriting an older Cloud Shell checkout.

```bash
DEPLOY_DIR="$(mktemp -d "$HOME/signalfoundry-deploy.XXXXXX")"
tar -xzf "$HOME/signalfoundry-upload.tar.gz" -C "$DEPLOY_DIR"
cd "$DEPLOY_DIR"
bash -n scripts/deploy_cloud_shell.sh
bash -n scripts/verify_live.sh
(cd backend && npm test)
# Inspect exactly what gcloud will upload; only Dockerfile, .dockerignore,
# package manifests and production src files should be listed.
(cd backend && gcloud meta list-files-for-upload)
bash scripts/deploy_cloud_shell.sh
```

The script creates a default Native Firestore database in `asia-south1` only when absent, and fails on lookup errors or an incompatible database. It creates dedicated `signalfoundry-runtime` and `signalfoundry-build` service accounts. Project-level role additions are limited to `roles/datastore.user` and `roles/aiplatform.user` for runtime, and `roles/run.builder` for builds. It does not grant Owner/Editor or modify the default compute account. The caller must be allowed to act as the dedicated accounts.

There are no delete/reset operations. Deployment does replace the named `signalfoundry-api` service configuration and the default Hosting release. `--allow-unauthenticated` intentionally grants public invocation on this service. Existing Firestore rules are preserved by default; newly created databases receive the supplied deny-all client rules. The Admin SDK does not depend on client rules. If this is a dedicated demo project with an existing database, explicitly deploy those rules with:

```bash
firebase deploy --only firestore:rules --project "$PROJECT_ID" --non-interactive
```

Do not run that optional command against a shared application database: it replaces client rules for the whole default database. Preserving existing rules does not guarantee those rules protect the demo collections; inspect them in the console if reusing a project.

## Verify real services

```bash
bash scripts/verify_live.sh
```

This makes **one real model request** and leaves a synthetic demo session/snapshot in Firestore. It checks public backend/Hosting health JSON, frontend files, five source artifacts, a Gemini-labelled result with accepted citations, identical snapshot retrieval through a separate backend request, and the document directly through the Firestore REST API. The production path always calls Vertex AI and has no mock fallback. The saved response and direct database read provide evidence beyond a health check; the model label alone is not proof. Evidence is saved under the printed temporary directory. A failure means the check has not passed; inspect its response file and logs. The direct Firestore read uses your signed-in user's read permission, so a 403 there can reflect operator IAM even if the runtime successfully saved data.

Then open the printed frontend URL in a private browser. Confirm five records, generate a brief, open an evidence badge, reload, and confirm the same brief restores. Add a fictional update, generate again, and confirm six source records and restored saved output. These browser interactions are still required; downloading HTML does not verify browser behavior.

To inspect a failure:

```bash
gcloud run services logs read signalfoundry-api \
  --region=asia-south1 --project="$PROJECT_ID" --limit=50
gcloud builds list --region=asia-south1 --project="$PROJECT_ID" --limit=5
```

Share the failure output (without credentials), or the printed frontend/backend URLs and verification output, for follow-up. Do not treat a health-only success as Gemini or Firestore verification. If IAM was just granted and the build reports permission denied, allow propagation and rerun the same script; do not add broad roles speculatively.
