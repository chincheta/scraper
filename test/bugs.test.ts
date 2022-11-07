import { describe, test } from '@jest/globals';
import puppeteer, { ElementHandle } from 'puppeteer';
import axios from 'axios';

describe('puppeteer', () => {
    test('goback', async () => {

        // let response = await axios.get(`http://127.0.0.1:9222/json/version`);
        let response = await axios.get(`http://192.168.1.43:9222/json/version`);

        let browser = await puppeteer.connect({
            browserWSEndpoint: response.data.webSocketDebuggerUrl,
            defaultViewport: null,
            slowMo: 100
        });

        let page = await browser.newPage();
        await page.goto('https://getbootstrap.com/docs/4.0/components/buttons/');

        let [element] = await page.$x('//nav//a[normalize-space()="Carousel"]');
        let promises: Promise<any>[] = [];

        promises.push(page.waitForNavigation());
        promises.push((element as ElementHandle<HTMLElement>).click());
        await Promise.all(promises);
        await page.goBack();
        await page.close();
        browser.disconnect();
    }, 30000);
});

