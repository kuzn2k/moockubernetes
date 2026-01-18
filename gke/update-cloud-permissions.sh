#!/bin/bash

PROJECT_ID="$(gcloud config get-value project)"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
echo "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
NODE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud artifacts repositories add-iam-policy-binding mooc --project=${PROJECT_ID} --location=europe-north2 --member="serviceAccount:${NODE_SA}" --role="roles/artifactregistry.reader"
gcloud storage buckets add-iam-policy-binding gs://mooc-project-backup --member="serviceAccount:${NODE_SA}" --role="roles/storage.objectCreator"
gcloud storage buckets add-iam-policy-binding gs://mooc-project-backup --member="serviceAccount:${NODE_SA}" --role="roles/storage.objectViewer"
