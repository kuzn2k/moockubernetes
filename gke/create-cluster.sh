#!/bin/sh

gcloud container clusters create dwk-cluster --zone=europe-north2-c --disk-size=32 --cluster-version=1.35 --num-nodes=3 --machine-type=e2-small --gateway-api=standard --scopes=cloud-platform

kubectl create namespace exercises
kubectl create namespace project
