# Prepare k3d cluster with Knative

update k3d to latest version (k3s >= 1.32)

````bash
wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | TAG=v5.9.0-rc.0 bash
````
Create knaive cluster

````bash
./create-serverless-cluster.sh
````

## Delpoy some apps

````bash
kn service create hello \
--image ghcr.io/knative/helloworld-go:latest \
--port 8080 \
--env TARGET=World
````

## Do requests

````bash
echo "Accessing URL $(kn service describe hello -o url)"
curl "$(kn service describe hello -o url)"
````