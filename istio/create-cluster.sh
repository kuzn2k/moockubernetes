#!/bin/sh

k3d cluster create --api-port 6550 -p '9080:80@loadbalancer' -p '9443:443@loadbalancer' --agents 2 --k3s-arg '--disable=traefik@server:*'
~/istio-1.28.3/bin/istioctl install --set profile=ambient --set values.global.platform=k3d --skip-confirmation
kubectl apply --server-side=true -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.0/standard-install.yaml
kubectl apply -f ~/istio-1.28.3/samples/addons/prometheus.yaml
kubectl apply -f ~/istio-1.28.3/samples/addons/kiali.yaml
kubectl label namespace default istio.io/dataplane-mode=ambient

