import path from 'path'
import { spawn, execSync } from 'child_process'
import { beforeAll, afterAll } from '@jest/globals'

let serverProcess

async function startMonitorServer() {
    const clientPath = process.cwd()
    const serverPath = process.env.MONITOR_SERVER_PATH || path.join(process.cwd(), '..', 'monitor-server')

    // Setup monitor-client
    execSync('npm link', { cwd: clientPath })
    execSync('npm run prepare', { cwd: clientPath })

    // Setup monitor-server
    execSync('npm link @shardus/monitor-client', { cwd: serverPath })
    execSync('npm run prepare', { cwd: serverPath })

    // Start server
    serverProcess = spawn('npm', ['start'], {
        cwd: serverPath,
        stdio: 'inherit',
    })

    return new Promise((resolve) => {
        // Give the server some time to start
        setTimeout(resolve, 10000)
    })
}

beforeAll(async () => {
    await startMonitorServer()
})

afterAll(() => {
    if (serverProcess) {
        serverProcess.kill()
    }
})