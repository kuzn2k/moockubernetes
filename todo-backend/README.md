# TODO backend app

## Build app

````bash
docker build -t kuzn2k/todo-backend:1.0.0 .
docker push kuzn2k/todo-backend:1.0.0
````

## Check logs

````bash
kubectl logs -f deloyment/todo-backend
````