# Log output app

## Build app

cd ../log-output
docker build -t kuzn2k/log-output:1.0.1 .
docker push kuzn2k/log-output:1.0.1

cd ../random-server
docker build -t kuzn2k/random-server:1.0.8 .
docker push kuzn2k/random-server:1.0.8

## Start server

kubectl apply -f manifest

## Check logs

kubectl logs -f deloyment/random-server

## Open sample page

Open url http://localhost:8081


