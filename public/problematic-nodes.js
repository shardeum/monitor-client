;(function main() {
  const G = {}
  loadToken(G)
  G.monitorServerUrl = monitorServerUrl || `https://127.0.0.1:3000/api`
  G.REFRESH_TIME = 10000

  new Vue({
    el: '#app',
    data() {
      return {
        problematicNodes: [],
        sortKey: 'isProblematic',
        sortAsc: false,
      }
    },
    computed: {
      sortedNodes() {
        return this.problematicNodes.sort((a, b) => {
          let modifier = this.sortAsc ? 1 : -1
          const valueA = a[this.sortKey]
          const valueB = b[this.sortKey]

          if (typeof valueA === 'number' && typeof valueB === 'number') {
            return (valueA - valueB) * modifier
          }

          if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
            return (valueA === valueB ? 0 : valueA ? -1 : 1) * modifier
          }

          if (valueA < valueB) return -1 * modifier
          if (valueA > valueB) return 1 * modifier
          return 0
        })
      },
      totalNodes() {
        return this.problematicNodes.length
      },
      problematicCount() {
        return this.problematicNodes.filter((n) => n.isProblematic).length
      },
      warningCount() {
        return this.problematicNodes.filter((n) => !n.isProblematic && n.totalRefutes > 0).length
      },
      healthyCount() {
        return this.problematicNodes.filter((n) => !n.isProblematic && n.totalRefutes === 0).length
      },
    },
    methods: {
      sortTable(key) {
        if (this.sortKey === key) {
          this.sortAsc = !this.sortAsc
        } else {
          this.sortKey = key
          this.sortAsc = key === 'nodeId' || key === 'ip' // Default ascending for text fields
        }
      },
      async fetchProblematicNodes() {
        try {
          const response = await requestWithToken(`${G.monitorServerUrl}/problematic-nodes`)
          if (response && response.data) {
            this.problematicNodes = response.data
          }
        } catch (error) {
          console.error('Error fetching problematic nodes:', error)
        }
      },
      startRefreshTimer() {
        setInterval(() => {
          this.fetchProblematicNodes()
        }, G.REFRESH_TIME)
      },
    },
    mounted() {
      this.fetchProblematicNodes()
      this.startRefreshTimer()
    },
  })
})()
