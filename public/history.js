new Vue({
    el: '#app',
    data() {
        return {
            sortBy: 'nodeId',
            sortDir: 'asc',
            filterBy: '',
            nodes: {
                joined: {},
                active: {},
                removed: {},
                lost: {}
            },
            sortOption: {
                sortChange: (params) => {
                    console.log('sortChange::', params)
                    if (params.heartbeat) {
                        this.sortBy = 'heartbeat'
                        this.sortDir = params.heartbeat
                    } else if (params.active) {
                        this.sortBy = 'active'
                        this.sortDir = params.active
                    } else if (params.joined) {
                        this.sortBy = 'joined'
                        this.sortDir = params.joined
                    } else if (params.crashed) {
                        this.sortBy = 'crashed'
                        this.sortDir = params.crashed
                    } else if (params.nodeId) {
                        this.sortBy = 'nodeId'
                        this.sortDir = params.nodeId
                    }
                    this.sortChange(params)
                }
            },
            columns: [
                {field: 'ip', key: 'a', title: 'IP', align: 'left'},
                {
                    field: 'port',
                    key: 'b',
                    title: 'Port',
                    align: 'center'
                },
                {
                    field: 'nodeId',
                    key: 'c',
                    title: 'Node ID',
                    align: 'left',
                    sortBy: ''
                },
                {
                    field: 'joined',
                    key: 'd',
                    title: 'Joined',
                    align: 'center',
                    sortBy: '',
                    renderBodyCell: ({row, column, rowIndex}, h) => {
                        if (!row.joined) return '-'
                        const time = String(moment(row.joined).format('h:mm:ss a'))
                        return time
                    }
                },
                {
                    field: 'active',
                    key: 'e',
                    title: 'Active',
                    align: 'center',
                    sortBy: '',
                    renderBodyCell: ({row, column, rowIndex}, h) => {
                        if (!row.active) return '-'
                        const time = String(moment(row.active).format('h:mm:ss a'))
                        return time
                    }
                },
                {
                    field: 'heartbeat',
                    key: 'f',
                    title: 'Last HB',
                    align: 'center',
                    sortBy: '',
                    renderBodyCell: ({row, column, rowIndex}, h) => {
                        if (!row.heartbeat) return '-'
                        const time = String(moment(row.heartbeat).format('h:mm:ss a'))
                        return time
                    }
                },
                {
                    field: 'crashed',
                    key: 'g',
                    title: 'Status',
                    align: 'center',
                    sortBy: '',
                    filter: {
                        filterList: [
                            {
                                value: 0,
                                label: "active",
                                selected: false,
                            },
                            {
                                value: 1,
                                label: "crashed",
                                selected: false,
                            },
                            {
                                value: 2,
                                label: "syncing",
                                selected: false,
                            }
                        ],
                        // filter confirm hook
                        filterConfirm: (filterList) => {
                            const status = filterList
                                .filter((x) => x.selected)
                                .map((x) => x.label);
                            this.searchByNodeStatus(status);
                        },
                        // filter reset hook
                        filterReset: (filterList) => {
                            this.searchByNodeStatus([]);
                        },
                    }
                }
            ],
            eventCustomOption: {
                bodyRowEvents: ({ row, column, rowIndex }) => {
                    return {
                        dblclick: (event) => {
                            const url = `/log?ip=${row.ip}&port=${row.port}`
                            window.open(url, '_blank').focus()
                        }
                    };
                },
            },
            tableData: [],
            sourceData: []
        }
    },
    async mounted() {
        await this.getTableData()
        setInterval(this.getTableData, 10000)
    },
    methods: {
        // search by date field
        searchByNodeStatus(status) {
            console.log('status', typeof status, status)
            this.filterBy = status[0]
            let sortObj = {}
            sortObj[this.sortBy] = this.sortDir
            this.sortChange(sortObj)
        },
        async getTableData() {
            console.log("getting table data")
            const resp = await request.get(`/api/history`)
            const history = resp.data
            this.sourceData = []
            for (let nodeId in history) {
                const node = history[nodeId]
                let row = {
                    ip: node.data.nodeIpInfo.externalIp,
                    port: node.data.nodeIpInfo.externalPort,
                    nodeId,
                    active: node.active,
                    joined: node.joined,
                    heartbeat: node.heartbeat,
                    removed: node.removed,
                    crashed: node.crashed ? 'crashed' : (node.active ? 'active' : 'syncing')
                }
                this.sourceData.push(row)
            }
            let sortObj = {}
            sortObj[this.sortBy] = this.sortDir
            this.sortChange(sortObj)
        },
        sortChange(params) {
            let data = this.sourceData.slice(0)
            console.log("this.filterBy", this.filterBy)
            if(this.filterBy === 'crashed') {
                data = this.sourceData.filter((x) => x.crashed === "crashed")
            } else if (this.filterBy === 'active') {
                data = this.sourceData.filter(x => x.crashed === "active")
            } else if (this.filterBy === 'syncing') {
                data = this.sourceData.filter(x => !x.active || x.crashed === "syncing")
            } else {
                data = [...this.sourceData]
            }
            data.sort((a, b) => {
                console.log('this.sortBy', this.sortBy)
                console.log('this.sortDir', this.sortDir)
                if (this.sortBy === 'heartbeat' || this.sortBy === 'active' || this.sortBy === 'joined') {
                    console.log('sorting by heartbeat', params.heartbeat)
                    if (this.sortDir === 'asc') {
                        return a[this.sortBy] - b[this.sortBy]
                    } else if (this.sortDir === 'desc') {
                        return b[this.sortBy] - a[this.sortBy]
                    } else {
                        return 0
                    }
                } else if (params.crashed) {
                    if (params.crashed === 'asc') {
                        return a.crashed > b.crashed ? -1 : 1
                    } else if (params.crashed === 'desc') {
                        return a.crashed < b.crashed ? -1 : 1
                    } else {
                        return 0
                    }
                } else if (params.nodeId) {
                    console.log('sorting by nodeId', params.nodeId)

                    if (params.nodeId === 'asc') {
                        return a.nodeId < b.nodeId ? -1 : 1
                    } else if (params.nodeId === 'desc') {
                        return a.nodeId > b.nodeId ? -1 : 1
                    } else {
                        return 0
                    }
                }
            })
            console.log('sorted data', data)
            this.tableData = [...data]
        }
    }

})
