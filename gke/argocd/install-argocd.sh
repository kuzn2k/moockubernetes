#!/bin/sh

kubectl create namespace argocd

kubectl apply -n argocd -f "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml"

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
kubectl -n argocd create secret generic sops-age --from-file=keys.txt="$ROOT_DIR/sensitive/key.txt"

echo "Waiting for argocd-cm to exist"
WAIT_SECONDS=60
WAIT_INTERVAL=2
ELAPSED=0
while ! kubectl -n argocd get configmap argocd-cm >/dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$WAIT_SECONDS" ]; then
    echo "Timed out waiting for argocd-cm"
    exit 1
  fi
  sleep "$WAIT_INTERVAL"
  ELAPSED=$((ELAPSED + WAIT_INTERVAL))
done

kubectl -n argocd patch configmap argocd-cm --type merge -p '{"data":{"kustomize.buildOptions":"--enable-alpha-plugins --enable-exec"}}'

kubectl patch deployment argocd-repo-server -n argocd --patch-file "$ROOT_DIR/gke/argocd/argocd-repo-server-ksops-path.yaml"

kubectl rollout restart deployment argocd-repo-server -n argocd
kubectl rollout status deployment argocd-repo-server -n argocd

echo "Creating applications"
kubectl apply -f "https://raw.githubusercontent.com/kuzn2k/moockubernetes-configs/main/argocd/argocd-root.yaml"

echo "Open port-forwarding for ArgoCD Admin console by"
echo "gcloud container clusters get-credentials dwk-cluster --zone europe-north2-c --project dwk-gke-484116 && kubectl port-forward --namespace argocd $(kubectl get pod --namespace argocd --selector="app.kubernetes.io/name=argocd-server" --output jsonpath='{.items[0].metadata.name}') 8080:8080"

echo "Decrypt admin password to ArgoCD by yourself"
kubectl get -n argocd secrets argocd-initial-admin-secret -o yaml
