# Prepare k3d cluster with Knative

update k3d to latest version (k3s >= 1.32)

````bash
wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | TAG=v5.9.0-rc.0 bash
````
Create knative cluster

````bash
../knative/create-serverless-cluster.sh
````

## Deploy app

````bash
kubectl apply -f manifest
````

## Open page

Check server URL by 
````bash
echo "Accessing URL $(kn service describe ping-pong-serverless -o url)"
````

Open url for ping pong http://<server_url>/pingpong




