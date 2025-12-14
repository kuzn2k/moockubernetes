# Sample TODO app

## Build app

    docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube
    docker build -t kuzn2k/todo-server:1.0.2
    docker push kuzn2k/todo-server:1.0.2

## Deploy server

    kubectl apply -f ../system
    kubectl apply -f manifest

## Check logs

    kubectl logs -f deloyment/todo-server

## Open sample page

Open url http://localhost:8081


