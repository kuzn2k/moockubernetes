## Build app

````bash
docker build -t kuzn2k/ping-pong-server:1.0.3 .
docker push kuzn2k/ping-pong-server:1.0.3
````

## Deploy app

````bash
kubectl apply -f manifest
````

## Open page

Open url for ping pong http://localhost:8081/pingpong

Get current counter http://localhost:8081/pings


