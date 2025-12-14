# Log output app

## Build docker image

docker build -t kuzn2k/log-output:1.0.1 .

and  publish

docker push kuzn2k/log-output:1.0.1

## Start application

cd ../random-server
kubectl apply -f manifest

## Check logs

kubectl logs -f deloyment/log-output
