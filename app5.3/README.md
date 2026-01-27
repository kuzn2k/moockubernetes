# Log output + ping pong app

## Create cluster with Istio

````bash
../istio/create-cluster.sh
````

## Build app and Deploy

````bash
cd ../log-output
docker build -t kuzn2k/log-output:1.0.1 .
docker push kuzn2k/log-output:1.0.1

cd ../random-server
docker build -t kuzn2k/random-server:1.0.9 .
docker push kuzn2k/random-server:1.0.9

cd ../greeter
docker build -t kuzn2k/greeter-server:1.0.0 .
docker push kuzn2k/greeter-server:1.0.0

docker build -t kuzn2k/ping-pong-server:1.0.9 .
docker push kuzn2k/ping-pong-server:1.0.9

cd ../app5.3
kustomize build . | kubectl apply -f -

kubectl label namespace exercises istio.io/dataplane-mode=ambient
kubectl annotate gateway random-server-gateway networking.istio.io/service-type=ClusterIP --namespace=exercises
````

## Open log-output page

````bash
kubectl port-forward svc/random-server-gateway-istio 8080:80 -n exercises
````

Open url http://localhost:8080

## Open ping-pong page

Open url http://localhost:8080/pingpong

