#!/usr/bin/env bash
set -euo pipefail
: "${PROJECT_ID:?Set PROJECT_ID to your billing-enabled Google Cloud project ID first}"
command -v gcloud >/dev/null || { echo 'gcloud CLI required'; exit 1; }
command -v firebase >/dev/null || { echo 'Firebase CLI required: npm install -g firebase-tools'; exit 1; }
command -v jq >/dev/null || { echo 'jq is required (available in Cloud Shell)'; exit 1; }
REGION=asia-south1
SERVICE=signalfoundry-api
SA_NAME=signalfoundry-runtime
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
BUILD_SA_NAME=signalfoundry-build
BUILD_SA_EMAIL="${BUILD_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
# Existing databases may serve other apps. Replacing their rules requires explicit opt-in.
DEPLOY_FIRESTORE_RULES="${DEPLOY_FIRESTORE_RULES:-0}"
[[ "$DEPLOY_FIRESTORE_RULES" == 0 || "$DEPLOY_FIRESTORE_RULES" == 1 ]] || { echo 'DEPLOY_FIRESTORE_RULES must be 0 or 1'; exit 1; }
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
gcloud config set project "$PROJECT_ID"
gcloud projects describe "$PROJECT_ID" --format='table(projectId,name,projectNumber)'
[[ "$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')" == True ]] || { echo 'Enable billing on the selected project first'; exit 1; }
# Fail before changing resources if Firebase authentication/setup is incomplete.
FIREBASE_PROJECTS="$(firebase projects:list --json)"
jq -e --arg project "$PROJECT_ID" '.result[] | select(.projectId == $project)' <<<"$FIREBASE_PROJECTS" >/dev/null || { echo 'Add this project to Firebase and authenticate with firebase login --no-localhost'; exit 1; }
HOSTING_SITES="$(firebase hosting:sites:list --project "$PROJECT_ID" --json)"
jq -e --arg suffix "/sites/$PROJECT_ID" '.result.sites[] | select(.name | endswith($suffix))' <<<"$HOSTING_SITES" >/dev/null || { echo 'Initialize the default Firebase Hosting site in the console first; expected site ID equals PROJECT_ID'; exit 1; }
echo '[1/6] Enabling APIs'
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com firestore.googleapis.com iam.googleapis.com --project "$PROJECT_ID"
echo '[2/6] Verifying default Firestore database'
# A failed list (permissions/API/network) is an error, never evidence of absence.
DATABASES="$(gcloud firestore databases list --project="$PROJECT_ID" --format=json)"
DB_TYPE="$(jq -r '.[] | select(.name | endswith("/databases/(default)")) | .type' <<<"$DATABASES")"
if [[ -z "$DB_TYPE" ]]; then
  gcloud firestore databases create --database='(default)' --location="$REGION" --type=firestore-native --project="$PROJECT_ID"
  DEPLOY_FIRESTORE_RULES=1
elif [[ "$DB_TYPE" != FIRESTORE_NATIVE ]]; then
  echo 'The existing (default) database is not Firestore Native. Use a compatible project.' >&2
  exit 1
fi
echo '[3/6] Ensuring runtime identity and limited IAM roles'
SERVICE_ACCOUNTS="$(gcloud iam service-accounts list --project="$PROJECT_ID" --format=json)"
for NAME in "$SA_NAME" "$BUILD_SA_NAME"; do
  EMAIL="${NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
  if ! jq -e --arg email "$EMAIL" '.[] | select(.email == $email)' <<<"$SERVICE_ACCOUNTS" >/dev/null; then
    gcloud iam service-accounts create "$NAME" --display-name="$NAME" --project="$PROJECT_ID"
  fi
done
for ROLE in roles/datastore.user roles/aiplatform.user; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA_EMAIL}" --role="$ROLE" --condition=None --quiet >/dev/null
done
# Explicit build identity: do not assume or broaden a project's default account.
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${BUILD_SA_EMAIL}" --role=roles/run.builder --condition=None --quiet >/dev/null
echo '[4/6] Deploying real API from source on Cloud Run' 
gcloud run deploy "$SERVICE" --source "$ROOT/backend" --region="$REGION" --project="$PROJECT_ID" \
  --build-service-account="projects/$PROJECT_ID/serviceAccounts/$BUILD_SA_EMAIL" \
  --allow-unauthenticated --service-account="$SA_EMAIL" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=global,GEMINI_MODEL=gemini-2.5-flash" \
  --memory=512Mi --timeout=60 --max-instances=1 --quiet
RUN_URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
echo '[5/6] Verifying Cloud Run and publishing Firebase Hosting'
curl --fail --silent --show-error "$RUN_URL/api/health" | jq -e '.status == "ok" and .service == "signalfoundry-api"'
echo
DEPLOY_TARGETS=hosting
if [[ "$DEPLOY_FIRESTORE_RULES" == 1 ]]; then
  DEPLOY_TARGETS=hosting,firestore:rules
else
  echo 'Preserving existing Firestore rules. Use DEPLOY_FIRESTORE_RULES=1 only if this project can use the supplied deny-all client rules.'
fi
firebase deploy --only "$DEPLOY_TARGETS" --project "$PROJECT_ID" --non-interactive
echo '[6/6] Verifying public Hosting proxy'
HOST_URL="https://${PROJECT_ID}.web.app"
curl --fail --silent --show-error "$HOST_URL/api/health" | jq -e '.status == "ok" and .service == "signalfoundry-api"'
echo
echo "FRONTEND: $HOST_URL"
echo "BACKEND: $RUN_URL"
echo 'NEXT: Open the frontend and generate a real brief. Inspect Cloud Run logs if generation fails.'
