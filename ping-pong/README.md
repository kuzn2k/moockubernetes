## Create cluster on GKE

````bash
../gke/create-cluster.sh
````

## Build app

````bash
docker build -t kuzn2k/ping-pong-server:1.0.6 .
docker push kuzn2k/ping-pong-server:1.0.6
````

## Deploy app

````bash
kubectl apply -f manifest
````

## Open page

Check server IP by 
````bash
kubectl get gateway -n exercises
````

Open url for ping pong http://<server_ip>/

## Remove cluster after finish

````bash
../gke/remove-cluster.sh
````


