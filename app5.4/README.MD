# Wiki Stub application

## Create cluster with Istio

````bash
../istio/create-cluster.sh
````

## Build app and Deploy

````bash
kubectl apply -f manifest
kubectl annotate gateway wiki-stub-gateway networking.istio.io/service-type=ClusterIP --namespace=exercises
````

## Open page

````bash
kubectl port-forward svc/wiki-stub-gateway-istio 8080:80 -n exercises
````

Open url http://localhost:8080


