# Comparison of DBasS vs. Postgres StatefulSet

## DBaaS (Cloud SQL)

- **Pros:** Fast setup (minutes), automatic patching, automated backups/PITR, built‑in monitoring, HA options, easy scaling, managed SSL/ IAM; minimal ops.
- **Cons:** Higher baseline cost, limited OS-level control, vendor constraints (extensions, flags), networking/IAM complexity, egress costs if cross‑region.
- **Init work:** Low (provision instance, users, network, import).
- **Ongoing maintenance:** Low (Google handles patches, backups, failover).
- **Backup methods:** Built‑in automated backups + PITR; exports to GCS; easy UI/API/terraform.
- **Costs:** Pay per instance (vCPU/RAM/storage), HA premium, IOPS/backup storage; predictable but higher.

## StatefulSet Postgres on GKE with PV

- **Pros:** Full control (extensions, configs), flexible storage choices, lower raw infra cost at small scale, runs close to app, custom backup tooling.
- **Cons:** You own HA, patching, tuning, replication, failover, and upgrades; more SRE time; riskier reliability without strong ops.
- **Init work:** Medium–High (charts/operators, PV class, secrets, replication/HA design, monitoring).
- **Ongoing maintenance:** High (manual upgrades, vacuum/tuning, failover testing, storage/IO tuning).
- **Backup methods:** DIY Custom implementation (pg_dump/pg_basebackup); more moving parts and testing required.
- **Costs:** Node + PV costs can be lower, but ops time and HA overhead can exceed DBaaS.

## When DBaaS is better

We want reliability and low ops overhead; need easy backups/PITR; small team; production risk tolerance is low.

## When StatefulSet is better

We need deep Postgres customization; strict cost control at small scale; we have strong SRE capacity and accept operational risk.



## Create cluster on GKE

````bash
../gke/create-cluster.sh
../update-cloud-permissions.sh
````

## Build app

````bash
cd todo-backend
docker build -t kuzn2k/todo-backend:1.0.7 .
docker push kuzn2k/todo-backend:1.0.7

cd ../todo-server
docker build -t kuzn2k/todo-server:1.0.7 .
docker push kuzn2k/todo-server:1.0.7

cd ../todo-reminder
docker build -t kuzn2k/todo-reminder:1.0.0 .
docker push kuzn2k/todo-reminder:1.0.0

cd ../backup-job
docker build -t kuzn2k/backup-job:1.0.0 .
docker push kuzn2k/backup-job:1.0.0
````

## Deploy app

````bash
export SOPS_AGE_KEY_FILE="$(pwd)/secrets/key.txt"
kustomize build . --enable-alpha-plugins --enable-exec | kubectl apply -f -
````

## Open TODO page

Check server IP by 
````bash
kubectl get gateway -n project
````

Open url http://<server_ip>

## Remove cluster after finish

````bash
../gke/remove-cluster.sh
````



