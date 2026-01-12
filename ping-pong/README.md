## Create cluster on GKE

````bash
../gke/create-cluster.sh
````

## Build app

````bash
docker build -t kuzn2k/ping-pong-server:1.0.3 .
docker push kuzn2k/ping-pong-server:1.0.3
````

## Deploy app

````bash
kubectl apply -f manifest
````

## Open page

Check server IP by 
````bash
kubectl get svc -n exercises
````

Open url for ping pong http://<server_ip>/pingpong

Get current counter http://<server_ip>/pings

## Remove cluster after finish

````bash
../gke/remove-cluster.sh
````


