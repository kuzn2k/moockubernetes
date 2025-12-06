# Log output app

## Start application

kubectl apply -f manifest/deployment.yaml

## Check logs

kubectl logs -f deloyment/log-output -n ex1-3
