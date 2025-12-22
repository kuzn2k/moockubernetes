# Log output + ping pong app

## Build app

````bash
cd ../log-output
docker build -t kuzn2k/log-output:1.0.1 .
docker push kuzn2k/log-output:1.0.1

cd ../random-server
docker build -t kuzn2k/random-server:1.0.3 .
docker push kuzn2k/random-server:1.0.3

cd ../ping-pong
docker build -t kuzn2k/ping-pong-server:1.0.2 .
docker push kuzn2k/ping-pong-server:1.0.2
````

## Deploy app

````bash
docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
kubectl apply -f ../system-exercises
kubectl apply -f manifest
````

## Open log-output page

Open url http://localhost:8081

## Open ping-pong page

Open url http://localhost:8081/pingpong


