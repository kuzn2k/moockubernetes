# TODO app

## Build app

````bash
cd todo-backend
docker build -t kuzn2k/todo-backend:1.0.3 .
docker push kuzn2k/todo-backend:1.0.3

cd ../todo-server
docker build -t kuzn2k/todo-server:1.0.5 .
docker push kuzn2k/todo-server:1.0.5
````

## Provide secrets configuration

````bash
cd secrets
sops -d secret.enc.yaml | kubectl apply -f -
````

## Deploy app

````bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
kubectl apply -f ../system-project
kubectl apply -f manifest
````

## Open TODO page

Open url http://localhost:8081



