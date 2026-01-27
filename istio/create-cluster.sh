#!/bin/sh

k3d cluster create --api-port 6550 -p '9080:80@loadbalancer' -p '9443:443@loadbalancer' --agents 2 --k3s-arg '--disable=traefik@server:*'
~/istio-1.28.3/bin/istioctl install --set profile=ambient --set values.global.platform=k3d --skip-confirmation
kubectl apply --server-side=true -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.0/standard-install.yaml
kubectl apply -f ~/istio-1.28.3/samples/addons/prometheus.yaml
kubectl apply -f ~/istio-1.28.3/samples/addons/kiali.yaml

kubectl create namespace exercises
kubectl create namespace project

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
kubectl apply -f "$ROOT_DIR/system-exercises/persistentvolume.yaml"


