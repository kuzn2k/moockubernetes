# TODO app

## Build app

````bash
cd ../todo-backend
docker build -t kuzn2k/todo-backend:1.0.0 .
docker push kuzn2k/todo-backend:1.0.0

cd ../todo-server
docker build -t kuzn2k/todo-server:1.0.4 .
docker push kuzn2k/todo-server:1.0.4
````

## Deploy app

````bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
kubectl apply -f ../system-project
kubectl apply -f manifest
````

## Open TODO page

Open url http://localhost:8081



