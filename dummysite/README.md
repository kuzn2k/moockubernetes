## Description

The controller watches `DummySite` resources and creates:
- a ConfigMap with `index.html` fetched from `spec.website_url`
- an NGINX Deployment wired to that ConfigMap
- a Service and Ingress for access

## Build app

````bash
cd dummysite-controller
docker build -t kuzn2k/dummysite-controller:1.0.0 .
docker push kuzn2k/dummysite-controller:1.0.0
````

## Deploy app

### Manual deployment

````bash
kustomize build . | kubectl apply -f -
kubectl apply -f dummysite.yaml
````

## Open created dummy site

Open url http://127.0.0.1:8081

