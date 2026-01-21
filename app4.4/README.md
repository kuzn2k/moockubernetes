# Log output + ping pong app

## Build app

````bash
cd ../log-output
docker build -t kuzn2k/log-output:1.0.1 .
docker push kuzn2k/log-output:1.0.1

cd ../random-server
docker build -t kuzn2k/random-server:1.0.8 .
docker push kuzn2k/random-server:1.0.8

cd ../ping-pong
docker build -t kuzn2k/ping-pong-server:1.0.9 .
docker push kuzn2k/ping-pong-server:1.0.9
````

## Deploy app

````bash
kubectl apply -f manifest
````

## Open log-output page

Open url http://localhost:8081

## Open ping-pong page

Open url http://localhost:8081/pingpong
