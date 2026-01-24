## Create cluster on GKE

````bash
../gke/create-cluster.sh
../update-cloud-permissions.sh
````

This also install and configures ArgoCD and two applications: Log and TODO

## Build app (optional, no ArgoCD pipeline)

````bash
cd todo-backend
docker build -t kuzn2k/todo-backend:1.0.8 .
docker push kuzn2k/todo-backend:1.0.8

cd ../todo-server
docker build -t kuzn2k/todo-server:1.0.7 .
docker push kuzn2k/todo-server:1.0.7

cd ../todo-reminder
docker build -t kuzn2k/todo-reminder:1.0.0 .
docker push kuzn2k/todo-reminder:1.0.0

cd ../broadcaster
docker build -t kuzn2k/broadcaster:1.0.1 .
docker push kuzn2k/broadcaster:1.0.1

cd ../backup-job
docker build -t kuzn2k/backup-job:1.0.0 .
docker push kuzn2k/backup-job:1.0.0
````

## Deploy app

### Manual deployment (without ArgoCD)

````bash
export SOPS_AGE_KEY_FILE="$(pwd)/base/secrets/key.txt"
cat images.patch >> base/kustomization.yaml
kustomize build base --enable-alpha-plugins --enable-exec | kubectl apply -f -
````
### ArgoCD pipeline

Just wait to rollout finishing after pushing to branch 'main' or making a tag a new vervion of TODO App

## Open TODO page

Check server IP by 
````bash
kubectl get gateway -n project
````

Open url http://<server_ip>

The App sends notification of TODO creating/updating in to Telegram's @moocdevopsbot

## Remove cluster after finish

````bash
../gke/remove-cluster.sh
````
