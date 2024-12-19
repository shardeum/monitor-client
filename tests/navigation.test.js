import { beforeAll, afterAll, describe, it, expect, beforeEach, afterEach, test, jest } from '@jest/globals';
import puppeteer from 'puppeteer';

jest.setTimeout(30000);

describe('Monitor Navigation Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    try {
      browser = await puppeteer.launch({
        headless: true,
      });
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    try {
      page = await browser.newPage();
      page.setDefaultNavigationTimeout(5000);
      page.on('console', msg => console.log('PAGE LOG:', msg.text()));
      page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
      page.on('error', err => console.log('ERROR:', err.toString()));
      page.on('requestfailed', request =>
        console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
      );
    } catch (error) {
      console.error('Failed to create new page:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (page) {
      await page.close().catch(console.error);
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close().catch(console.error);
    }
  });

  describe('Homepage Navigation', () => {
    beforeEach(async () => {
      try {
        await page.goto('http://localhost:3000', {
          waitUntil: ['domcontentloaded'],
          timeout: 5000
        });
      } catch (error) {
        console.error('Failed to navigate to homepage:', error);
        throw error;
      }
    });

    test('should display all navigation groups', async () => {
      await page.waitForSelector('.nav-group');
      const groups = await page.$$('.nav-group');
      expect(groups.length).toBe(4); // Main, Logs, Network, Analytics
    });

    test('should highlight Large Network View link', async () => {
      await page.waitForSelector('.nav-link.highlight');
      const largeNetworkLink = await page.$('.nav-link.highlight');
      const text = await page.evaluate(el => el.textContent, largeNetworkLink);
      expect(text).toBe('Large Network View');
    });

    test('all links should be functional', async () => {
      const links = [
        { path: '/', text: 'Home' },
        { path: '/large-network', text: 'Large Network View' },
        { path: '/signin', text: 'Sign In' },
        { path: '/log', text: 'Log' },
        { path: '/history-log', text: 'Historical Logs' },
        { path: '/history', text: 'Node History' },
        { path: '/node-loads', text: 'Node Loads' },
        { path: '/sync-details', text: 'Sync Details' },
        { path: '/sync', text: 'Sync Status' },
        { path: '/chart', text: 'Charts' },
        { path: '/monitor-events', text: 'Monitor Events' },
        { path: '/app-versions', text: 'Application Versions' },
        { path: '/summary', text: 'Summary' }
      ];

      for (const link of links) {
        await page.waitForSelector(`a[href="${link.path}"]`);
        const linkElement = await page.$(`a[href="${link.path}"]`);
        expect(linkElement).not.toBeNull();
        const text = await page.evaluate(el => el.textContent, linkElement);
        expect(text).toBe(link.text);
      }
    });
  });

  describe('Large Network View Navigation', () => {
    beforeEach(async () => {
      try {
        await page.goto('http://localhost:3000/large-network', {
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout: 5000
        });
      } catch (error) {
        console.error('Failed to navigate to large network view:', error);
        throw error;
      }
    });

    test('should display same navigation as homepage', async () => {
      await page.waitForSelector('.nav-group');
      const groups = await page.$$('.nav-group');
      expect(groups.length).toBe(4);
    });

    test('should maintain existing functionality', async () => {
      // Check if key elements of large network view are present
      await page.waitForSelector('#mynetwork');
      const networkDiv = await page.$('#mynetwork');
      expect(networkDiv).not.toBeNull();

      await page.waitForSelector('td#monheader');
      const monitorTool = await page.$('td#monheader');
      const text = await page.evaluate(el => el.textContent, monitorTool);
      expect(text).toBe('MONITOR TOOL');
    });
  });

  describe('Cross-Route Navigation Presence', () => {
    const routes = [
      '/',
      '/large-network',
      '/signin',
      '/log',
      '/history-log',
      '/history',
      '/node-loads',
      '/sync-details',
      '/sync',
      '/chart',
      '/monitor-events',
      '/app-versions',
    ];

    test.each(routes)('should display navigation on %s route', async (route) => {
      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout: 5000
        });

        await page.waitForSelector('.nav-group');
        const groups = await page.$$('.nav-group');
        expect(groups.length).toBe(4);

        const links = await page.$$('.nav-link');
        expect(links.length).toBeGreaterThan(0);
      } catch (error) {
        console.error(`Failed to verify navigation on ${route}:`, error);
        throw error;
      }
    });
  });
}); 