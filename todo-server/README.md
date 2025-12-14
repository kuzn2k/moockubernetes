# Sample TODO app

## Build app

 ````bash
docker build -t kuzn2k/todo-server:1.0.4 .
docker push kuzn2k/todo-server:1.0.4
````
## Check logs

````bash
kubectl logs -f deloyment/todo-server
````

## Open sample page

Open url http://localhost:8081


