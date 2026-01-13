# Log output + ping pong app

## Create cluster on GKE

````bash
../gke/create-cluster.sh
````

## Build app

````bash
cd ../log-output
docker build -t kuzn2k/log-output:1.0.1 .
docker push kuzn2k/log-output:1.0.1

cd ../random-server
docker build -t kuzn2k/random-server:1.0.4 .
docker push kuzn2k/random-server:1.0.4

cd ../ping-pong
docker build -t kuzn2k/ping-pong-server:1.0.4 .
docker push kuzn2k/ping-pong-server:1.0.4
````

## Deploy app

````bash
kubectl apply -f manifest
````

## Open log-output page

Check server IP by 
````bash
kubectl get ing -n exercises
````

Open url http://<server_ip>

## Open ping-pong page

Open url http://<server_ip>/pingpong

## Remove cluster after finish

````bash
../gke/remove-cluster.sh
````