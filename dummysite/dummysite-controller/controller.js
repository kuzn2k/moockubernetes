import * as k8s from '@kubernetes/client-node'

const GROUP = 'stable.dwk'
const VERSION = 'v1'
const PLURAL = 'dummysites'
const MAX_HTML_BYTES = 1024 * 1024

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi)
const appsApi = kc.makeApiClient(k8s.AppsV1Api)
const coreApi = kc.makeApiClient(k8s.CoreV1Api)
const netApi = kc.makeApiClient(k8s.NetworkingV1Api)
const watcher = new k8s.Watch(kc)

function appLabel(name) {
  return `dummysite-${name}`
}

function buildOwnerRef(cr) {
  return [
    {
      apiVersion: `${GROUP}/${VERSION}`,
      kind: 'DummySite',
      name: cr.metadata.name,
      uid: cr.metadata.uid,
      controller: true,
      blockOwnerDeletion: true
    }
  ]
}

function buildConfigMap(cr, html) {
  const namespace = cr.metadata.namespace
  const name = `${cr.metadata.name}-content`
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name,
      namespace,
      labels: { app: appLabel(cr.metadata.name) },
      ownerReferences: buildOwnerRef(cr)
    },
    data: {
      'index.html': html
    }
  }
}

function buildDeployment(cr) {
  const namespace = cr.metadata.namespace
  const name = `${cr.metadata.name}-deployment`
  const label = appLabel(cr.metadata.name)
  const configMapName = `${cr.metadata.name}-content`

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name,
      namespace,
      labels: { app: label },
      ownerReferences: buildOwnerRef(cr)
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: label } },
      template: {
        metadata: { labels: { app: label } },
        spec: {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:1.27-alpine',
              ports: [{ containerPort: 80 }],
              volumeMounts: [
                {
                  name: 'site-content',
                  mountPath: '/usr/share/nginx/html/index.html',
                  subPath: 'index.html'
                }
              ]
            }
          ],
          volumes: [
            {
              name: 'site-content',
              configMap: {
                name: configMapName,
                items: [{ key: 'index.html', path: 'index.html' }]
              }
            }
          ]
        }
      }
    }
  }
}

function buildService(cr) {
  const namespace = cr.metadata.namespace
  const name = `${cr.metadata.name}-service`
  const label = appLabel(cr.metadata.name)

  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name,
      namespace,
      labels: { app: label },
      ownerReferences: buildOwnerRef(cr)
    },
    spec: {
      type: 'ClusterIP',
      selector: { app: label },
      ports: [{ port: 80, targetPort: 80 }]
    }
  }
}

function buildIngress(cr) {
  const namespace = cr.metadata.namespace
  const name = `${cr.metadata.name}-ingress`
  const serviceName = `${cr.metadata.name}-service`

  return {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name,
      namespace,
      ownerReferences: buildOwnerRef(cr)
    },
    spec: {
      rules: [
        {
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: serviceName,
                    port: { number: 80 }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  }
}

async function upsert(readFn, createFn, replaceFn, body, kind, name, namespace) {
  try {
    await readFn({ name, namespace })
    await replaceFn({ name, namespace, body })
  } catch (err) {
    const statusCode = err?.response?.statusCode ?? err?.statusCode ?? err?.code
    if (statusCode === 404) {
      await createFn({ namespace, body })
    } else {
      console.error(`${kind} ${namespace}/${name} reconcile failed`, err?.body || err)
      throw err
    }
  }
}

async function upsertService(body, namespace) {
  try {
    const existing = await coreApi.readNamespacedService({
      name: body.metadata.name,
      namespace
    })
    if (existing?.body?.spec?.clusterIP) {
      body.spec.clusterIP = existing.body.spec.clusterIP
    }
    await coreApi.replaceNamespacedService({
      name: body.metadata.name,
      namespace,
      body
    })
  } catch (err) {
    const statusCode = err?.response?.statusCode ?? err?.statusCode ?? err?.code
    if (statusCode === 404) {
      await coreApi.createNamespacedService({ namespace, body })
    } else {
      console.error(`Service ${namespace}/${body.metadata.name} reconcile failed`, err?.body || err)
      throw err
    }
  }
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'dummysite-controller/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`)
  }

  const html = await response.text()
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return html.slice(0, MAX_HTML_BYTES)
  }

  return html
}

async function reconcile(cr) {
  const name = cr.metadata.name
  const namespace = cr.metadata.namespace || 'default'
  const websiteUrl = cr?.spec?.website_url

  if (!websiteUrl) {
    console.warn(`DummySite ${namespace}/${name} missing spec.website_url`)
    return
  }

  let html
  try {
    html = await fetchHtml(websiteUrl)
  } catch (err) {
    console.error(`DummySite ${namespace}/${name} fetch failed`, err?.message || err)
    return
  }

  const configMap = buildConfigMap(cr, html)
  const deployment = buildDeployment(cr)
  const service = buildService(cr)
  const ingress = buildIngress(cr)

  await upsert(
    coreApi.readNamespacedConfigMap.bind(coreApi),
    coreApi.createNamespacedConfigMap.bind(coreApi),
    coreApi.replaceNamespacedConfigMap.bind(coreApi),
    configMap,
    'ConfigMap',
    configMap.metadata.name,
    namespace
  )

  await upsert(
    appsApi.readNamespacedDeployment.bind(appsApi),
    appsApi.createNamespacedDeployment.bind(appsApi),
    appsApi.replaceNamespacedDeployment.bind(appsApi),
    deployment,
    'Deployment',
    deployment.metadata.name,
    namespace
  )

  await upsertService(service, namespace)

  await upsert(
    netApi.readNamespacedIngress.bind(netApi),
    netApi.createNamespacedIngress.bind(netApi),
    netApi.replaceNamespacedIngress.bind(netApi),
    ingress,
    'Ingress',
    ingress.metadata.name,
    namespace
  )

  console.log(`DummySite ${namespace}/${name} reconciled`) 
}

async function cleanup(cr) {
  const namespace = cr.metadata.namespace || 'default'
  const baseName = cr.metadata.name
  const deleteIfExists = async (fn, kind, name) => {
    try {
      await fn({ name, namespace })
    } catch (err) {
      const statusCode = err?.response?.statusCode ?? err?.statusCode ?? err?.code
      if (statusCode !== 404) {
        console.error(`${kind} ${namespace}/${name} delete failed`, err?.body || err)
      }
    }
  }

  await deleteIfExists(netApi.deleteNamespacedIngress.bind(netApi), 'Ingress', `${baseName}-ingress`)
  await deleteIfExists(coreApi.deleteNamespacedService.bind(coreApi), 'Service', `${baseName}-service`)
  await deleteIfExists(appsApi.deleteNamespacedDeployment.bind(appsApi), 'Deployment', `${baseName}-deployment`)
  await deleteIfExists(coreApi.deleteNamespacedConfigMap.bind(coreApi), 'ConfigMap', `${baseName}-content`)
}

async function listAndReconcile() {
  const response = await customObjectsApi.listClusterCustomObject({
    group: GROUP,
    version: VERSION,
    plural: PLURAL
  })
  const items = response?.body?.items || []
  for (const item of items) {
    await reconcile(item)
  }
}

async function startWatch() {
  await watcher.watch(
    `/apis/${GROUP}/${VERSION}/${PLURAL}`,
    {},
    async (type, obj) => {
      if (!obj?.metadata?.name) return
      if (type === 'ADDED' || type === 'MODIFIED') {
        await reconcile(obj)
      } else if (type === 'DELETED') {
        await cleanup(obj)
      }
    },
    (err) => {
      if (err) {
        console.error('Watch ended', err)
        setTimeout(startWatch, 5000)
      }
    }
  )
}

async function main() {
  await listAndReconcile()
  await startWatch()
}

main().catch((err) => {
  console.error('Controller failed to start', err)
  process.exit(1)
})
