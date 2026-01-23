# Log output + ping pong app

## Create cluster on GKE

````bash
../gke/create-cluster.sh
````
This command also installs ArgoCD and configures log-app

## Build app and Deploy

Just make sure ArgoCD is active and configured for log-app

## Open log-output page

Check server IP by 
````bash
kubectl get gateway -n exercises
````

Open url http://<server_ip>

## Open ping-pong page

Open url http://<server_ip>/pingpong

## Remove cluster after finish

````bash
../gke/remove-cluster.sh
````