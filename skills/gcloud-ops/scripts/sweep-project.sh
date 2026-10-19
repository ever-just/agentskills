#!/bin/bash
# Read-only inventory of one GCP project. Usage: sweep-project.sh PROJECT_ID OUT_DIR
# Writes OUT_DIR/PROJECT_ID.txt. Only queries a service when its API is enabled.
p="$1"; out="${2:?usage: sweep-project.sh PROJECT_ID OUT_DIR}/$p.txt"
{
  svc=$(gcloud services list --enabled --project "$p" --format='value(config.name)' 2>&1)
  if echo "$svc" | grep -qi "error\|denied\|forbidden\|not been used"; then
    echo "SERVICES: unavailable ($(echo "$svc" | head -1 | cut -c1-90))"
  else
    n=$(echo "$svc" | grep -c .)
    # Hide APIs that are on by default so the notable list stays readable.
    notable=$(echo "$svc" | grep -Ev '^(bigquery|bigquerymigration|bigquerystorage|cloudapis|clouddebugger|cloudtrace|datastore|logging|monitoring|servicemanagement|serviceusage|sql-component|storage-api|storage-component|storage|cloudresourcemanager|iam|iamcredentials|oslogin|pubsub|analyticshub|dataform|dataplex|cloudaicompanion|geminicloudassist|containerregistry|artifactregistry|networkconnectivity|cloudquotas|deploymentmanager|testing|policytroubleshooter|privilegedaccessmanager|recommender|dns)\.googleapis\.com$' | sed 's/\.googleapis\.com//' | tr '\n' ' ')
    echo "SERVICES: $n enabled. Notable: ${notable:-none}"
    has() { echo "$svc" | grep -q "^$1\.googleapis\.com$"; }
    has compute && echo "VMS: $(gcloud compute instances list --project "$p" --format='value(name,zone.basename(),status)' 2>&1 | head -5 | tr '\n' ';')"
    has run && echo "CLOUD RUN: $(gcloud run services list --project "$p" --format='value(metadata.name)' 2>&1 | head -10 | tr '\n' ' ')"
    has cloudfunctions && echo "FUNCTIONS: $(gcloud functions list --project "$p" --format='value(name)' 2>&1 | head -10 | tr '\n' ' ')"
    has container && echo "GKE: $(gcloud container clusters list --project "$p" --format='value(name)' 2>&1 | head -5 | tr '\n' ' ')"
    has sqladmin && echo "SQL: $(gcloud sql instances list --project "$p" --format='value(name)' 2>&1 | head -5 | tr '\n' ' ')"
    has appengine && echo "APPENGINE: $(gcloud app describe --project "$p" --format='value(id,servingStatus)' 2>&1 | head -2 | tr '\n' ' ')"
    has secretmanager && echo "SECRETS: $(gcloud secrets list --project "$p" --format='value(name)' 2>&1 | wc -l | tr -d ' ') secrets"
    has firestore && echo "FIRESTORE: enabled"
  fi
  echo "BUCKETS: $(gcloud storage buckets list --project "$p" --format='value(name)' 2>&1 | head -8 | tr '\n' ' ')"
  echo "BILLING: $(gcloud billing projects describe "$p" --format='value(billingEnabled)' 2>&1 | head -1 | cut -c1-80)"
} > "$out" 2>&1
