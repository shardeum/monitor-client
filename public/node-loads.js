(function main() {
  const G = {}
  loadToken(G)
  G.monitorServerUrl = monitorServerUrl || `https://127.0.0.1:3000/api`
  G.REFRESH_TIME = 10000

  new Vue({
      el: '#app',
      data() {
          return {
              nodeLoads: [],
              sortKey: 'ip',
              sortAsc: true,
          }
      },
      computed: {
          sortedNodes() {
              return this.nodeLoads.sort((a, b) => {
                  let modifier = this.sortAsc ? 1 : -1
                  const valueA = a[this.sortKey]
                  const valueB = b[this.sortKey]

                  if (typeof valueA === 'number' && typeof valueB === 'number') {
                      return (valueA - valueB) * modifier
                  }

                  if (valueA < valueB) return -1 * modifier
                  if (valueA > valueB) return 1 * modifier
                  return 0
              })
          },
      },
      methods: {
          sortTable(key) {
              if (this.sortKey === key) {
                  this.sortAsc = !this.sortAsc
              } else {
                  this.sortKey = key
                  this.sortAsc = true
              }
          },
          async fetchChanges() {
              const results = await Promise.all([
                  requestWithToken(
                      `${G.monitorServerUrl}/report?timestamp=${G.lastUpdatedTimestamp}`
                  ),
                  requestWithToken(
                      `${G.monitorServerUrl}/list-foundation-nodes`
                  ),
              ])
              const listOfFoundationNodes = results[1].data
              const data =  results[0].data
              const activeNodesIds = Object.keys(data.nodes.active)
              for (let i = 0; i < activeNodesIds.length; i++) {
                  const nodeId = activeNodesIds[i]
                  data.nodes.active[nodeId].nodeIsFoundationNode = listOfFoundationNodes.includes(data.nodes.active[nodeId].nodeIpInfo.externalIp)
              }
              return data
          },
          updateNetworkStatus(report) {
              this.nodeLoads = []
              for (let nodeId in report.nodes.active) {
                  const node = report.nodes.active[nodeId]
                  this.nodeLoads.push({
                      id: nodeId,
                      ip: node.nodeIpInfo.externalIp,
                      port: node.nodeIpInfo.externalPort,
                      loadInternal: node.currentLoad.nodeLoad.internal.toFixed(3),
                      loadExternal: node.currentLoad.nodeLoad.external.toFixed(3),
                      queueLengthAll: node.queueLengthAll || 0,
                      queueLength: node.queueLength || 0,
                      bucket15: node.queueLengthBuckets?.c15 || 0,
                      bucket60: node.queueLengthBuckets?.c60 || 0,
                      bucket120: node.queueLengthBuckets?.c120 || 0,
                      bucket600: node.queueLengthBuckets?.c600 || 0,
                      avgQueueTime: node.txTimeInQueue.toFixed(3),
                      maxQueueTime: node.maxTxTimeInQueue.toFixed(3),
                      memoryRss: node.memory?.rss || 0,
                      memoryHeapTotal: node.memory?.heapTotal || 0,
                      memoryHeapUsed: node.memory?.heapUsed || 0,
                      memoryExternal: node.memory?.external || 0,
                      memoryArrayBuffers: node.memory?.arrayBuffers || 0,
                      nodeIsFoundationNode: node.nodeIsFoundationNode
                  })
              }
          },
          async updateNodes() {
              try {
                  let changes = await this.fetchChanges()
                  console.log({method: 'updateNodes', changes})
                  this.updateNetworkStatus(changes)
              } catch (e) {
                  console.log('Error while trying to update nodes.', e)
              }
          },
          start() {
              this.updateNodes()
              setInterval(this.updateNodes, G.REFRESH_TIME)
          },
      },
      mounted() {
          console.log('Mounted')
          this.start()
      },
  })
})()