# Log output app

## Start application

kubectl apply -f deployment.yaml

## Check logs

kubectl logs -f deloyment/log-output -n ex1-1

## Suspend execution

kubectl scale deployment --all -n ex1-1 --replicas=0

## Resume execution

kubectl scale deployment --all -n ex1-1 --replicas=1