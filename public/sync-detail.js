;(function main() {
    const G = {}
    loadToken(G)
    G.VW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    G.VH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    G.R = 100
    G.X = 0
    G.Y = 0
    G.MAX_EDGES_FOR_NODE = 1
    G.REFRESH_TIME = 10000
    G.maxId = parseInt('ffff', 16)
    G.lastUpdatedTimestamp = 0
    G.nodes = {
        joining: {},
        syncing: {},
        active: {},
        standby: {},
    }
    let n = 0
    let tracker = {}
    let maxN = 0
    let C = 150

    new Vue({
        el: '#app',
        data() {
            return {
                networkStatus: {
                    active: 0,
                    syncing: 0,
                    standby: 0,
                    joining: 0,
                    counter: 0,
                    desired: 0,
                    tps: 0,
                    maxTps: 0,
                    processed: 0,
                    rejected: 0,
                    rejectedTps: 0,
                    netLoad: 0,
                    load: 0,
                    totalLoad: 0,
                    maxLoad: 0,
                    queueLength: 0,
                    totalQueueLength: 0,
                    queueTime: 0,
                    totalQueueTime: 0,
                    expiredTx: 0,
                },
                syncColors: {
                    insync: {
                        C: '#02e602',
                        CE: '#06a106',
                        E: '#015e01',
                    },
                    outofsync: {
                        C: '#f600f6',
                        CE: '#b606b6',
                        E: '#5a015a',
                    },
                },
                borderColors: {
                    BLACK: '#000000',
                    DARKGRAY: '#525151',
                    GRAY: '#999595',
                    LIGHTGRAY: '#ccc5c5',
                    OFFWHITE: '#cecece',
                },
                recentRuntimeSyncColor: '#FFD700',
                colorMode: 'state',
                animateTransactions: false,
                queueDetails: false,
                nodeLoads: [],
                sortKey: 'cycleFinishedSyncing',
                sortAsc: false,
                sortOrder: -1,
                shouldRefresh: true,
                hideEdgeOOS: false,
                hideFullyInSync: false,
                recentRuntimeSyncMap: new Map(),
                isRecentActiveCycles: 4,
                showAllRadixes: false,
            }
        },
        async mounted() {
            console.log('Mounted')
            this.start()
        },
        computed: {
            sortedNodes() {
                return this.nodeLoads.slice().sort((a, b) => {
                    let aValue, bValue

                    if (this.sortKey === 'unexpectedOOSAll') {
                        aValue = this.isUnexpectedOOS(a)
                        bValue = this.isUnexpectedOOS(b)
                    } else if (this.sortKey === 'unexpectedOOSC') {
                        aValue = this.isUnexpectedOOS(a, true)
                        bValue = this.isUnexpectedOOS(b, true)
                    } else {
                        aValue = a[this.sortKey]
                        bValue = b[this.sortKey]
                    }

                    aValue = aValue !== undefined ? aValue : ''
                    bValue = bValue !== undefined ? bValue : ''

                    return (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) * this.sortOrder
                })
            },
        },
        methods: {
            getRadixSyncStyle(nodeId, radixId) {
                const uniqueKey = `${nodeId}-${radixId}`
                const recentRuntimeSyncCycle = this.recentRuntimeSyncMap.get(uniqueKey)
                if (!recentRuntimeSyncCycle) return {}
                const cyclesAgo = recentRuntimeSyncCycle
                let borderColor

                if (cyclesAgo === 1) {
                    borderColor = this.borderColors.BLACK
                } else if (cyclesAgo === 2) {
                    borderColor = this.borderColors.DARKGRAY
                } else if (cyclesAgo === 3) {
                    borderColor = this.borderColors.GRAY
                } else if (cyclesAgo >= 4) {
                    borderColor = this.borderColors.LIGHTGRAY
                } else {
                    borderColor = this.borderColors.OFFWHITE
                }

                return { backgroundColor: borderColor }
            },
            getBackgroundColor(r) {
                let colorKey = ''

                if (r.inConsensusRange && r.inEdgeRange) {
                    colorKey = 'CE'
                } else if (r.inConsensusRange) {
                    colorKey = 'C'
                } else if (r.inEdgeRange) {
                    colorKey = 'E'
                }

                if (r.recentRuntimeSync) {
                    return this.syncColors.insync[colorKey]
                } else if (this.hideEdgeOOS && !r.insync && !r.inConsensusRange && r.inEdgeRange) {
                    return this.syncColors.outofsync[colorKey]
                } else {
                    return r.insync
                        ? this.syncColors.insync[colorKey]
                        : this.syncColors.outofsync[colorKey]
                }
            },
            getLegendColorStyle(color) {
                return {
                    backgroundColor: color,
                    display: 'inline-block',
                    width: '30px',
                    height: '30px',
                    lineHeight: '30px',
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                }
            },
            async fetchChanges() {
                const results = await Promise.all([
                    requestWithToken(
                        `${monitorServerUrl}/report?timestamp=${G.lastUpdatedTimestamp}`
                    ),
                    requestWithToken(
                        `${monitorServerUrl}/list-foundation-nodes`
                    ),
                ])
                const listOfFoundationNodes = results[1].data
                const data =  results[0].data
                const activeNodesIds = Object.keys(data.nodes.active)
                for (let i = 0; i < activeNodesIds.length; i++) {
                    data.nodes.active[activeNodesIds[i]].nodeIsFoundationNode = listOfFoundationNodes.includes(data.nodes.active[activeNodesIds[i]].nodeIpInfo.externalIp)
                }
                return data
            },
            changeShouldRefresh() {
                this.shouldRefresh = !this.shouldRefresh
            },
            changeHideEdgeOOS() {
                this.hideEdgeOOS = !this.hideEdgeOOS
            },
            changeHideFullyInSync() {
                this.hideFullyInSync = !this.hideFullyInSync
                this.updateNodes()
            },
            filterOutCrashedNodes(report) {
                let filterdActiveNodes = {}
                for (let nodeId in report.nodes.active) {
                    const node = report.nodes.active[nodeId]
                    let age = Date.now() - node.timestamp
                    if (age <= 60000) {
                        filterdActiveNodes[nodeId] = node
                    }
                }
                console.log('filtered active nodes', Object.keys(filterdActiveNodes).length)
                report.nodes.active = { ...filterdActiveNodes }
            },
            updateNetworkStatus(report) {
                if (Object.keys(report.nodes.active).length === 0) return // don't update stats if no nodes send the
                let reportPercentage =
                    Object.keys(report.nodes.active).length / Object.keys(G.nodes.active).length
                console.log('reportPercentage', reportPercentage)
                if (reportPercentage < 0.3) return // don't update stats if less than 30% of network updates

                this.nodeLoads = []

                for (let nodeId in report.nodes.active) {
                    const node = report.nodes.active[nodeId]
                    const result = node.lastInSyncResult
                    this.networkStatus.counter = node.cycleCounter

                    for (let radix of result?.radixes || []) {
                        const recentRuntimeSyncCycle = radix.recentRuntimeSyncCycle || -1
                        const uniqueKey = `${nodeId}-${radix.radix}`
                        if (recentRuntimeSyncCycle !== -1) {
                            this.recentRuntimeSyncMap.set(uniqueKey, recentRuntimeSyncCycle)
                        }
                    }
                    node.radixes = result?.radixes || []
                    if (this.hideFullyInSync && this.isUnexpectedOOS(node).total === 0) continue
                    this.nodeLoads.push({
                        id: nodeId,
                        ip: node.nodeIpInfo.externalIp,
                        port: node.nodeIpInfo.externalPort,
                        inSync: result?.insync,
                        total: result?.stats.total,
                        good: result?.stats.good,
                        bad: result?.stats.bad,
                        radixes: result?.radixes,
                        stillNeedsInitialPatchPostActive: node.stillNeedsInitialPatchPostActive,
                        cycleFinishedSyncing: node.cycleFinishedSyncing,
                        recentRuntimeSync: result?.radixes.some((r) => r.recentRuntimeSync),
                        fullRadixArray: this.generateFullRadixArray(node),
                        nodeIsFoundationNode: node.nodeIsFoundationNode,
                    })
                }
            },
            radixClass(r) {
                if (r.recentRuntimeSync) {
                    return 'recent-runtime-sync'
                }
                if (this.hideEdgeOOS && !r.insync && !r.inConsensusRange && r.inEdgeRange) {
                    return 'inconsensus-oosync'
                }
                return r.insync ? 'insync' : 'oosync'
            },
            isInSync(node) {
                if (this.hideEdgeOOS && !node.inSync) {
                    return node.radixes
                        ?.filter((r) => r.inConsensusRange && !r.inEdgeRange)
                        .every((r) => r.insync)
                }
                return node.inSync
            },
            sortTable(key) {
                if (this.sortKey === key) {
                    this.sortAsc = !this.sortAsc
                } else {
                    this.sortKey = key
                    this.sortAsc = true
                }
            },
            async updateNodes() {
                if (!this.shouldRefresh) return

                try {
                    let changes = await this.fetchChanges()
                    console.log(
                        `Total of ${Object.keys(changes.nodes.active).length}/${
                            Object.keys(G.nodes.active).length
                        } nodes updated.`
                    )
                    this.filterOutCrashedNodes(changes)
                    console.log(
                        'number of active nodes after filter',
                        Object.keys(changes.nodes.active).length
                    )
                    this.updateNetworkStatus(changes)
                } catch (e) {
                    console.log('Error while trying to update nodes.', e)
                }
            },
            isUnexpectedOOS(node, CAndCEOnly = false) {
                const currentCounter = this.networkStatus.counter
                let CUnexpectedOOSCount = 0
                let EUnexpectedOOSCount = 0
                let CEUnexpectedOOSCount = 0
                
                const radixes = node.radixes ?? []

                for (let radix of radixes) {
                    if (CAndCEOnly && radix.inEdgeRange) continue
                    if (!radix.insync) {
                        const recentlyActive =
                            currentCounter - node.cycleFinishedSyncing <= this.isRecentActiveCycles
                        const hasRecentSync = radix.recentRuntimeSync

                        if (!recentlyActive && !hasRecentSync) {
                            if (radix.inConsensusRange && radix.isEdgeRange) {
                                CEUnexpectedOOSCount++
                            } else if (radix.inConsensusRange) {
                                CUnexpectedOOSCount++
                            } else if (radix.inEdgeRange) {
                                EUnexpectedOOSCount++
                            }
                        }
                    }
                }

                return {
                    total: CUnexpectedOOSCount + EUnexpectedOOSCount + CEUnexpectedOOSCount,
                    C: CUnexpectedOOSCount,
                    E: EUnexpectedOOSCount,
                    CE: CEUnexpectedOOSCount,
                }
            },
            toggleShowAllRadixes() {
                this.showAllRadixes = !this.showAllRadixes
            },
            generateFullRadixArray(node) {
                const validRadixes = node.radixes
                    .map((r) => parseInt(r.radix, 16))
                    .filter((r) => !isNaN(r) && r < 1e6)

                if (validRadixes.length === 0) {
                    return []
                }

                // Find the maximum radix value
                const maxRadix = Math.max(...validRadixes)

                // Create an array with length maxRadix + 1 (to include 0)
                let fullArray = new Array(maxRadix + 1).fill(null)

                for (let radix of node.radixes) {
                    let index = parseInt(radix.radix, 16)
                    if (!isNaN(index) && index <= maxRadix) {
                        fullArray[index] = radix
                    }
                }

                return fullArray
            },
            getRadixStyle(radix) {
                if (radix) {
                    return { backgroundColor: this.getBackgroundColor(radix) }
                } else {
                    return { backgroundColor: 'white', border: '1px solid #ccc' }
                }
            },
            async start() {
                const results = await Promise.all([
                    requestWithToken(
                        `${monitorServerUrl}/report`
                    ),
                    requestWithToken(
                        `${monitorServerUrl}/list-foundation-nodes`
                    ),
                ])
                const listOfFoundationNodes = results[1].data
                const report =  results[0].data
                const activeNodesIds = Object.keys(report.nodes.active)
                for (let i = 0; i < activeNodesIds.length; i++) {
                    report.nodes.active[activeNodesIds[i]].nodeIsFoundationNode = listOfFoundationNodes.includes(report.nodes.active[activeNodesIds[i]].nodeIpInfo.externalIp)
                }
                this.filterOutCrashedNodes(report)
                this.updateNetworkStatus(report)

                setInterval(this.updateNodes, G.REFRESH_TIME)
            },
        },
    })
})()
