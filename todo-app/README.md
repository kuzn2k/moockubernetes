# TODO app

## Create cluster on GKE

````bash
../gke/create-cluster.sh
````

## Build app

````bash
cd todo-backend
docker build -t kuzn2k/todo-backend:1.0.5 .
docker push kuzn2k/todo-backend:1.0.5

cd ../todo-server
docker build -t kuzn2k/todo-server:1.0.5 .
docker push kuzn2k/todo-server:1.0.5

cd ../todo-reminder
docker build -t kuzn2k/todo-reminder:1.0.0 .
docker push kuzn2k/todo-reminder:1.0.0
````

## Deploy app

````bash
export SOPS_AGE_KEY_FILE="$(pwd)/secrets/key.txt"
kustomize build . --enable-alpha-plugins --enable-exec | kubectl apply -f -
````

## Open TODO page

Check server IP by 
````bash
kubectl get gateway -n project
````

Open url http://<server_ip>

## Remove cluster after finish

````bash
../gke/remove-cluster.sh
````



