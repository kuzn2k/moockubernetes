# Log output app

## Start server

kubectl apply -f manifest/deployment.yaml

default port is 3000 specified in deployment.yaml

## Check logs

kubectl logs -f deloyment/todo-server

