# Log output app

## Start server

kubectl apply -f manifest/deployment.yaml

## Check logs

kubectl logs -f deloyment/todo-server -n ex1-2

