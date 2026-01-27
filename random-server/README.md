# Log output app

## Build app

cd ../log-output
docker build -t kuzn2k/log-output:1.0.1 .
docker push kuzn2k/log-output:1.0.1

cd ../random-server
docker build -t kuzn2k/random-server:1.0.9 .
docker push kuzn2k/random-server:1.0.9

cd ../greeter
docker build -t kuzn2k/greeter-server:1.0.0 .
docker push kuzn2k/greeter-server:1.0.0

## Start server

kubectl apply -f manifest

## Check logs

kubectl logs -f deloyment/random-server

## Open sample page

Open url http://localhost:8081


