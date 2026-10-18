#!/usr/bin/env bash
# Real network checks: one billed Gemini generation and one persisted snapshot.
set -euo pipefail
: "${PROJECT_ID:?Set PROJECT_ID first}"
RUN_URL="$(gcloud run services describe signalfoundry-api --region=asia-south1 --project="$PROJECT_ID" --format='value(status.url)')"
HOST_URL="https://${PROJECT_ID}.web.app"
SESSION_ID="$(node -e 'console.log(require("node:crypto").randomUUID())')"
EVIDENCE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/signalfoundry-live.XXXXXX")"
printf 'Session: %s\nEvidence directory: %s\n' "$SESSION_ID" "$EVIDENCE_DIR"

for BASE in "$RUN_URL" "$HOST_URL"; do
  curl --fail-with-body --silent --show-error --max-time 70 "$BASE/api/health" |
    jq -e '.status == "ok" and .service == "signalfoundry-api"'
done
curl --fail-with-body --silent --show-error "$HOST_URL/" -o "$EVIDENCE_DIR/index.html"
grep -qi 'SignalFoundry' "$EVIDENCE_DIR/index.html"
for ASSET in app.js styles.css; do
  curl --fail-with-body --silent --show-error "$HOST_URL/$ASSET" -o "$EVIDENCE_DIR/$ASSET"
  test -s "$EVIDENCE_DIR/$ASSET"
done
curl --fail-with-body --silent --show-error --max-time 70 \
  "$HOST_URL/api/workspace?sessionId=$SESSION_ID" -o "$EVIDENCE_DIR/workspace.json"
jq -e '.artifacts | length == 5' "$EVIDENCE_DIR/workspace.json"

echo 'Calling the deployed Gemini path and saving the result to Firestore...'
curl --fail-with-body --silent --show-error --max-time 70 \
  -H 'Content-Type: application/json' -d "{\"sessionId\":\"$SESSION_ID\"}" \
  "$HOST_URL/api/briefs/generate" -o "$EVIDENCE_DIR/generated.json"
jq -e '.snapshot | (.id | type == "string" and length > 0) and
  .model == "gemini-2.5-flash" and .sourceCount == 5 and
  (.verification.sourcesUsed | length > 0)' "$EVIDENCE_DIR/generated.json"
SNAPSHOT_ID="$(jq -r '.snapshot.id' "$EVIDENCE_DIR/generated.json")"

# A separate request via the direct backend must retrieve the identical snapshot.
curl --fail-with-body --silent --show-error --max-time 70 \
  "$RUN_URL/api/briefs/latest?sessionId=$SESSION_ID" -o "$EVIDENCE_DIR/latest.json"
diff -u <(jq -S '.snapshot' "$EVIDENCE_DIR/generated.json") <(jq -S '.snapshot' "$EVIDENCE_DIR/latest.json")

# Independently read the actual Firestore document using the operator's identity.
# Keep the bearer token out of arguments, output, and saved evidence files.
ACCESS_TOKEN="$(gcloud auth print-access-token)"
printf 'Authorization: Bearer %s\n' "$ACCESS_TOKEN" |
  curl --fail-with-body --silent --show-error --header @- \
    "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/demo_sessions/$SESSION_ID/snapshots/$SNAPSHOT_ID" \
    -o "$EVIDENCE_DIR/firestore.json"
unset ACCESS_TOKEN
jq -e --arg id "$SNAPSHOT_ID" --arg generatedAt "$(jq -r '.snapshot.generatedAt' "$EVIDENCE_DIR/generated.json")" \
  '(.name | endswith("/snapshots/" + $id)) and
   .fields.generatedAt.stringValue == $generatedAt and
   .fields.model.stringValue == "gemini-2.5-flash" and
   .fields.sourceCount.integerValue == "5"' "$EVIDENCE_DIR/firestore.json"

jq '.snapshot | {id, model, generatedAt, sourceCount, verification}' "$EVIDENCE_DIR/generated.json"
printf 'PASS: public HTTP endpoints, frontend files, generation, retrieval, and direct Firestore read.\nFRONTEND: %s\nBACKEND: %s\n' "$HOST_URL" "$RUN_URL"
echo 'Still required: open the frontend in a private browser, generate a brief, click evidence, then reload and confirm restoration.'
