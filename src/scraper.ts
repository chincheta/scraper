import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

import axios from 'axios';
import ScraperContext from './context';


export default class Scraper {
    browser: Browser | undefined
    chromeHost: string = 'localhost';
    chromePort: number = 9222;
    timeout: number = 5000;

    constructor(options?: { chromeHost?: string, chromePort?: number, timeout?: number }) {
        puppeteer.use(StealthPlugin());
        this.browser = undefined;
        if (options) {
            if (options.chromeHost) {
                this.chromeHost = options.chromeHost;
            }
            if (options.chromePort) {
                this.chromePort = options.chromePort;
            }
            if (options.timeout) {
                this.timeout = options.timeout;
            }
        }
    }

    private async getChromeDebugUrl(): Promise<string | undefined> {
        try {
            let response = await axios.get(`http://${this.chromeHost}:${this.chromePort}/json/version`);
            return response.data.webSocketDebuggerUrl;
        } catch (error) {
            return undefined;
        }
    }

    private async initBrowser(): Promise<Browser> {
        let chromeUrl: string | undefined = await this.getChromeDebugUrl();

        if (chromeUrl) {
            return await puppeteer.connect({
                browserWSEndpoint: chromeUrl,
                defaultViewport: null,
                slowMo: 100
            });
        } else {
            throw new Error(`Chrome instance not found at ${this.chromeHost}:${this.chromePort}.`);
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            this.browser.disconnect()
            this.browser = undefined;
        }
    }

    async createContext(url: string): Promise<ScraperContext> {
        if (!this.browser) {
            this.browser = await this.initBrowser();
        }
        let page: Page = await this.goto(url, this.browser);
        let context = new ScraperContext(this.browser, page, this.timeout);
        return context;
    }

    async destroyContext(context: ScraperContext): Promise<void> {
        await context.page.close();
    }

    // browser as argument to avoid test and wrong coverage report
    private async goto(url: string, browser: Browser): Promise<Page> {
        let page = await browser.newPage();

        await page.bringToFront();
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en' });
        await Promise.all([
            page.waitForNavigation(),
            page.goto(url)]);
        return page;
    }
};