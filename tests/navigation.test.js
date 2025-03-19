import { it, describe, beforeEach, beforeAll, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'

describe('Monitor Navigation Tests', () => {
    let navigationHtml

    beforeAll(() => {
        // Read the actual navigation HTML file
        navigationHtml = fs.readFileSync(
            path.join(process.cwd(), 'views/shared/navigation.html'),
            'utf8'
        )
    })

    beforeEach(() => {
        // setup
    })

    describe('Basic Navigation Tests', () => {
        it('should contain all required navigation sections', () => {
            // Check for main sections
            expect(navigationHtml).toContain('<div class="menu-title">Main</div>')
            expect(navigationHtml).toContain('<div class="menu-title">Logs</div>')
            expect(navigationHtml).toContain('<div class="menu-title">Network</div>')
            expect(navigationHtml).toContain('<div class="menu-title">Analytics</div>')
        })

        it('should have correct navigation links in Main section', () => {
            // Check for specific links in the Main section
            expect(navigationHtml).toContain('<a href="/" class="nav-link">Home</a>')
            expect(navigationHtml).toContain(
                '<a href="/large-network" class="nav-link highlight">Large Network View</a>'
            )
            expect(navigationHtml).toContain('<a href="/signin" class="nav-link">Sign In</a>')
        })

        it('should have correct navigation links in Logs section', () => {
            // Check for specific links in the Logs section
            expect(navigationHtml).toContain('<a href="/log" class="nav-link">Log</a>')
            expect(navigationHtml).toContain(
                '<a href="/history-log" class="nav-link">Historical Logs</a>'
            )
            expect(navigationHtml).toContain('<a href="/history" class="nav-link">Node History</a>')
        })

        it('should have correct navigation links in Network section', () => {
            // Check for specific links in the Network section
            expect(navigationHtml).toContain(
                '<a href="/node-loads" class="nav-link">Node Loads</a>'
            )
            expect(navigationHtml).toContain(
                '<a href="/sync-details" class="nav-link">Sync Details</a>'
            )
            expect(navigationHtml).toContain('<a href="/sync" class="nav-link">Sync Status</a>')
        })

        it('should have correct navigation links in Analytics section', () => {
            // Check for specific links in the Analytics section
            expect(navigationHtml).toContain('<a href="/chart" class="nav-link">Charts</a>')
            expect(navigationHtml).toContain(
                '<a href="/monitor-events" class="nav-link">Monitor Events</a>'
            )
            expect(navigationHtml).toContain(
                '<a href="/app-versions" class="nav-link">Application Versions</a>'
            )
            expect(navigationHtml).toContain('<a href="/summary" class="nav-link">Summary</a>')
        })
    })
})
