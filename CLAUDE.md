# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Shardeum Monitor Client - a web-based dashboard for monitoring the Shardeum blockchain network. It's a multi-page application using vanilla JavaScript with HTML/CSS templates.

## Commands

### Development
- `npm ci` - Install dependencies (use instead of npm install)
- `npm run compile` - Compile TypeScript files
- `npm run lint` - Run ESLint on TypeScript files
- `npm run format-check` - Check code formatting
- `npm run format-fix` - Auto-fix code formatting

### Testing
- `npm test` - Run all tests
- `npm run test:e2e` - Run E2E navigation tests
- For E2E tests on Mac: Set `PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`

### Local Development with Monitor Server
1. In monitor-client: `npm ci && npm link && npm run prepare`
2. In monitor-server: `npm ci && npm link @shardeum-foundation/monitor-client && npm run prepare`
3. Stop existing monitor server: `shardus pm2 stop <index>`
4. Start monitor server: `npm start`

### Release Process
- `npm run release:patch` - Patch release (1.0.0 → 1.0.1)
- `npm run release:minor` - Minor release (1.0.0 → 1.1.0)
- `npm run release:major` - Major release (1.0.0 → 2.0.0)
- Pre-releases: `npm run release:prepatch|preminor|premajor|prerelease`

## Architecture

### File Structure
- `/public/` - Frontend JavaScript/CSS files (main application code)
- `/views/` - HTML templates for each page
- `/views/shared/` - Shared components (navigation.html)
- `/build/` - Compiled TypeScript output
- `/tests/` - Test files

### Key Technologies
- **UI Libraries**: Chart.js (data visualization), Vis Network (network graphs), Popmotion (animations)
- **HTTP Client**: Axios
- **TypeScript**: Extends Google's style guide (gts), compiles to JavaScript
- **Code Style**: Prettier (single quotes, no semicolons, 120 char width)

### Main Features
Each feature has corresponding HTML template and JavaScript file:
- **Network Monitoring**: large-network.js, node-loads.js, sync.js, sync-detail.js
- **Logging**: log.js, history-log.js, history.js
- **Analytics**: myChart.js, app-versions.js, monitor-events.js
- **Authentication**: auth.js, signin.js

### Development Notes
- The project uses vanilla JavaScript - no React/Vue/Angular
- Each page has its own HTML file and corresponding JS file
- TypeScript is used for development but runtime is JavaScript
- E2E tests expect monitor-server at `../monitor-server` (or set `MONITOR_SERVER_PATH`)