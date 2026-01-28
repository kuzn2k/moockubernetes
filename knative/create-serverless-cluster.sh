#!/bin/sh

k3d cluster create --api-port 6550 -p '9080:80@loadbalancer' -p '9443:443@loadbalancer' --agents 2 --k3s-arg '--disable=traefik@server:*'

kubectl create namespace exercises
kubectl create namespace project

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
kubectl apply -f "$ROOT_DIR/system-exercises/persistentvolume.yaml"

echo Installing Knative

kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.20.2/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.20.2/serving-core.yaml

kubectl apply -f https://github.com/knative-extensions/net-kourier/releases/download/knative-v1.20.0/kourier.yaml

kubectl patch configmap/config-network \
--namespace knative-serving \
--type merge \
--patch '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'

kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.20.2/serving-default-domain.yaml

echo Check external IP
kubectl --namespace kourier-system get service kourier

kubectl get pods -n knative-serving



