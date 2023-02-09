import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import Scraper from '../src/scraper'
import * as dotenv from 'dotenv'
import { executablePath } from 'puppeteer';
import { DateTime } from 'luxon';

describe('failure scraper-context tests', () => {
    beforeAll(async () => {
        dotenv.config()
    });

    test('fails with too many links for a click', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.click('//a'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('fails with too many links for a middle click', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.middleClick('//a'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('click on something not found', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.click('//does-not-exist'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('middle click on something not found', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.middleClick('//does-not-exist'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('type on something not found', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.type('Apple', '//input[@placeholder="Does not exist"]'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('value of something not found', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.getInputValue('//input[@placeholder="Does not exist"]'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('values of something not found', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.getSelectedValues('//select[@placeholder="Does not exist"]'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('labels of something not found', async () => {
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await expect(context.getSelectedLabels('//select[@placeholder="Does not exist"]'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);

    test('click on invisible', async () => {
        const html = `
        <html>
            <body>
                <a style="display: none" href="#">invisible</a>
            </body>
        </html>`;
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext(`data:text/html,${html}`);

        await expect(context.click('//a'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);



    test('middle click on invisible', async () => {
        const html = `
        <html>
            <body>
                <a style="display: none" href="#">invisible</a>
            </body>
        </html>`;
        let scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        let context = await scraper.createContext(`data:text/html,${html}`);

        await expect(context.middleClick('//a'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
        await scraper.close();
    }, 30000);
});


describe('context tests', () => {
    let scraper: Scraper;
    beforeAll(async () => {
        dotenv.config()
        scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost' });
        return;
    });

    afterAll(async () => {
        await scraper.close();
        return;
    });

    test('scrap attributes many', async () => {
        let anchors: Record<string, string | null>[];
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        anchors = await context.scrapeAttributesMany('//nav//a');
        expect(anchors[0].href).toBe('/docs/4.0/getting-started/introduction/');
        await scraper.destroyContext(context);
    }, 30000);

    test('scrap attributes one', async () => {
        let href: string | null;
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        href = (await context.scrapeAttributesOne('//nav//a')).href;
        expect(href).toBe('/docs/4.0/getting-started/introduction/');
        await scraper.destroyContext(context);
    }, 30000);

    test('scrap many', async () => {
        let anchors: string[];
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        anchors = await context.scrapeMany('//nav//a');
        expect(anchors[0]).toBe("Getting started");
        await scraper.destroyContext(context);
    }, 30000);

    test('scrap one', async () => {
        let anchor: string;
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        anchor = await context.scrapeOne('//nav//a');
        expect(anchor).toBe("Getting started");
        await scraper.destroyContext(context);
    }, 30000);

    test('type', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/input-group/');

        await context.type('chincheta', '//input[@id=(//label[normalize-space()="Your vanity URL"]/@for)]');
        let value = await context.getInputValue('//input[@id=(//label[normalize-space()="Your vanity URL"]/@for)]');
        expect(value).toBe('chincheta');
        await scraper.destroyContext(context);
    }, 30000);

    test('contains', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/');
        let contains: boolean = await context.contains('//pepe', 1000);
        expect(contains).toBeFalsy();
        contains = await context.contains('//h1', 1000);
        expect(contains).toBeTruthy();
        await scraper.destroyContext(context);
    }, 30000);

    test('back', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/buttons/');
        await context.click('//nav//a[normalize-space()="Carousel"]', { expectNavigation: true });
        expect(context.url()).toBe('https://getbootstrap.com/docs/4.0/components/carousel/');
        await context.goBack();
        await context.click('//nav//a[normalize-space()="Carousel"]', { expectNavigation: true });
        expect(context.url()).toBe('https://getbootstrap.com/docs/4.0/components/carousel/');
        await scraper.destroyContext(context);
    }, 30000);

    test('click', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/buttons/');
        await context.click('//nav//a[normalize-space()="Carousel"]', { expectNavigation: true });
        expect(context.url()).toBe('https://getbootstrap.com/docs/4.0/components/carousel/');
        await scraper.destroyContext(context);
    }, 30000);

    test('middle click', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/buttons/');
        let newContext = await context.middleClick('//nav//a[normalize-space()="Carousel"]');
        expect(newContext.url()).toBe('https://getbootstrap.com/docs/4.0/components/carousel/');
        await scraper.destroyContext(context);
        await scraper.destroyContext(newContext);
    }, 30000);

    test('get input value by placeholder', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        await context.type('john@doe.com', '//input[@placeholder="Enter email"]');
        let email = await context.getInputValue('//input[@placeholder="Enter email"]');
        expect(email).toBe('john@doe.com');
        await scraper.destroyContext(context);
    }, 30000);

    test('get input value by label', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');

        await context.type('john@doe.com', '//input[@id=(//label[normalize-space()="Email address"]/@for)]');

        let email = await context.getInputValue('//input[@id=(//label[normalize-space()="Email address"]/@for)]');
        expect(email).toBe('john@doe.com');
        await scraper.destroyContext(context);
    }, 30000);

    test('click modal', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/modal/');

        expect(await context.isVisible('//*[@id="exampleModalLive"]')).toBeFalsy();

        await context.click('//button[normalize-space()="Launch demo modal" and @data-target="#exampleModalLive"]', { expectNavigation: false });
        expect(await context.isVisible('//*[@id="exampleModalLive"]')).toBeTruthy();

        await context.click('//*[@id="exampleModalLive"]//button[normalize-space()="Close"]', { expectNavigation: false });
        expect(await context.isVisible('//*[@id="exampleModalLive"]')).toBeFalsy();
        await scraper.destroyContext(context);
    }, 30000);

    test('scrolls into view', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/modal/');

        let oldY = await context.page.evaluate(() => window.pageYOffset);
        await context.scrollIntoView('//h3[normalize-space()="Scrolling long content"]');
        let newY = await context.page.evaluate(() => window.pageYOffset);
        expect(newY).toBeGreaterThan(oldY);

        await scraper.destroyContext(context);
    }, 30000);

    test('reload', async () => {
        let context = await scraper.createContext('http://blogs.sitepointstatic.com/examples/tech/js-session/index.html');

        let count1 = await context.scrapeOne('//*[normalize-space()="You have visited this page:"]/following-sibling::*');

        await context.reload();
        let count2 = await context.scrapeOne('//*[normalize-space()="You have visited this page:"]/following-sibling::*');
        expect(count1).not.toBe(count2);

        await scraper.destroyContext(context);
    }, 30000);

    test('scrapes visible / invisible', async () => {
        const html = `
        <html>
            <body>
                <div>a</div>
                <div style="display:none">b</div>
                <div>c</div>
                <div>d</div>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);
        let divs = await context.scrapeMany('//div');
        expect(divs.length).toBe(3);
        divs = await context.scrapeMany('//div', {includeInvisible: true});
        expect(divs.length).toBe(4);
        await scraper.destroyContext(context);
    }, 30000);

    test('wait', async () => {
        const html = `
        <html>
            <body>
                <form>
                    <label for="selectId">Brand</label>
                    <select id="selectId">
                        <option value="volvo">Volvo</option>
                        <option value="saab">Saab</option>
                        <option value="mercedes">Mercedes</option>
                        <option value="audi">Audi</option>
                    </select>
                </form>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);
        let t0 = DateTime.utc();
        await context.wait(6000);
        expect(t0.diffNow().milliseconds).toBeLessThan(-5900);
        await scraper.destroyContext(context);
    }, 30000);

    test('select', async () => {
        const html = `
        <html>
            <body>
                <form>
                    <label for="selectId">Brand</label>
                    <select id="selectId">
                        <option value="volvo">Volvo</option>
                        <option value="saab">Saab</option>
                        <option value="mercedes">Mercedes</option>
                        <option value="audi">Audi</option>
                    </select>
                </form>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);

        await context.selectByValue(['mercedes'], '//select[@id=(//label[normalize-space()="Brand"]/@for)]');


        let [label] = await context.getSelectedLabels('//select[@id=(//label[normalize-space()="Brand"]/@for)]');
        expect(label).toStrictEqual('Mercedes');
        let [value] = await context.getSelectedValues('//select[@id=(//label[normalize-space()="Brand"]/@for)]');
        expect(value).toStrictEqual('mercedes');
        await scraper.destroyContext(context);
    }, 30000);

    test('multiple select', async () => {
        const html = `
        <html>
            <body>
                <form>
                    <label for="selectId">Brand</label>
                    <select id="selectId" multiple>
                        <option value="volvo">Volvo</option>
                        <option value="saab">Saab</option>
                        <option value="mercedes">Mercedes</option>
                        <option value="audi">Audi</option>
                    </select>
                </form>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);

        await context.selectByValue(['volvo', 'mercedes'], '//select[@id=(//label[normalize-space()="Brand"]/@for)]');

        let labels = await context.getSelectedLabels('//select[@id=(//label[normalize-space()="Brand"]/@for)]');
        expect(labels).toStrictEqual(['Volvo', 'Mercedes']);
        let values = await context.getSelectedValues('//select[@id=(//label[normalize-space()="Brand"]/@for)]');
        expect(values).toStrictEqual(['volvo', 'mercedes']);
        await scraper.destroyContext(context);
    }, 30000);
});

