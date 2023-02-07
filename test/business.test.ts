import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import Scraper from '../src/scraper'
import * as dotenv from 'dotenv'
import Table from '../src/table';
import { DateTime } from "luxon";

describe('yahoo finance tests', () => {
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

    test('scrap stock', async () => {
        let context = await scraper.createContext('https://finance.yahoo.com/');

        await context.type('Tesla', '//input[@id="yfin-usr-qry"]');
        await context.click('//*[@data-id="result-quotes-0"]');
        await context.clickIfExists('//button[normalize-space()="Maybe later"]', { expectNavigation: false });

        await context.click('//*[@id="quote-nav"]//a[normalize-space()="Summary"]');


        let labels = await context.scrapeMany('//*[@id="Main"]//tr/td[1]');
        let values = await context.scrapeMany('//*[@id="Main"]//tr/td[2]');
        expect(labels.length).toBeGreaterThan(0);
        expect(labels.length).toBe(values.length);
        expect(labels[0]).toBe('Previous Close');


        await context.click('//*[@id="quote-nav"]//a[normalize-space()="Statistics"]');
        labels = await context.scrapeMany('//*[@id="Main"]//tr/td[1]');
        values = await context.scrapeMany('//*[@id="Main"]//tr/td[2]');
        expect(labels.length).toBeGreaterThan(0);
        expect(labels.length).toBe(values.length);
        expect(labels[0]).toBe('Market Cap (intraday)');

        await context.click('//*[@id="quote-nav"]//a[normalize-space()="Profile"]');

        let sector = await context.scrapeOne('//span[normalize-space()="Sector(s)"]/following-sibling::span');
        let industry = await context.scrapeOne('//span[normalize-space()="Industry"]/following-sibling::span');
        expect(sector).toBe('Consumer Cyclical');
        expect(industry).toBe('Auto Manufacturers');



        await context.click('//*[@id="quote-nav"]//a[normalize-space()="Financials"]');

        // already there
        // await scraper.click(`//*[@role="tablist"]//a[normalize-space()="Income Statement"]`);

        labels = await context.scrapeMany('//*[@data-test="fin-row"]//*[@title]');

        expect(labels.length).toBeGreaterThan(0);
        expect(labels[0]).toBe('Total Revenue');

        await context.click('//*[@role="tablist"]//a[normalize-space()="Balance Sheet"]');

        labels = await context.scrapeMany('//*[@data-test="fin-row"]//*[@title]');
        expect(labels.length).toBeGreaterThan(0);
        expect(labels[0]).toBe('Total Assets');
        await scraper.destroyContext(context);

    }, 60000);

    test('scrap earnings', async () => {
        let context = await scraper.createContext("https://finance.yahoo.com/calendar/earnings");

        await context.type('Microsoft', '//*[@placeholder="Find earnings for symbols"]');
        await context.click('(//*[@data-id="result-quotes-0"])');
        let dateTimes = await context.scrapeMany('//*[@id="fin-cal-table"]//tr//td[3]//span[1]');
        let zones = await context.scrapeMany('//*[@id="fin-cal-table"]//tr//td[3]//span[2]');
        let translation: Record<string, string> = {
            'GMT': 'Europe/London',
            'BST': 'Europe/London',
            'CEST': 'Europe/Berlin',
            'CET': 'Europe/Berlin',
            'EET': 'Europe/Athens',
            'EEST': 'Europe/Athens',
            'EST': 'America/New_York',
            'EDT': 'America/New_York',
            'CST': 'America/Chicago',
            'CDT': 'America/Chicago',
            'MST': 'America/Denver',
            'MDT': 'America/Denver',
            'PST': 'America/Los_Angeles',
            'PDT': 'America/Los_Angeles',
        }

        let now = DateTime.utc();
        let futureDates: DateTime[] = [];
        let pastDates: DateTime[] = [];

        for (let i = 0; i < dateTimes.length; i++) {
            let s = dateTimes[i] + " " + translation[zones[i]];
            // replace like-space chars by spaces
            s = s.replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000]/g, ' ')
            // Oct 28, 2022, 2 AM Europe/Berlin
            var date = DateTime.fromFormat(s, "MMM dd, yyyy, h a z");
            if (date < now) {
                pastDates.push(date);
                continue;
            }
            futureDates.push(date);
        }
        let next: string | undefined;
        let last: string | undefined;
        if (futureDates.length > 0) {
            let nextEarningsDate = futureDates.sort((d1, d2) => d1.diff(d2).milliseconds)[0];
            let pastEarningsDate = pastDates.sort((d1, d2) => d2.diff(d1).milliseconds)[0];
            next = nextEarningsDate.toISO();
            last = pastEarningsDate.toISO();
        }

        expect(pastDates.length).toBeGreaterThan(0);

        await scraper.destroyContext(context);
    }, 60000);
});



describe('investing.com tests', () => {
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

    test('scrap index table', async () => {
        let dax = await scraper.createContext('https://www.investing.com/indices/major-indices');
        await dax.click('//main//a[normalize-space()="DAX"]');
        await dax.click('//nav[@data-test="navigation-menu"]//a[normalize-space()="Components"]');

        let quotes: Table = await dax.scrapeTable('//*[@id="marketInnerContent"]', { headers: [null, 'name', 'last', 'high', 'low', 'change', 'changePct', 'volume', 'time', null] });
        let timestamps = (await dax.scrapeAttributesMany('//*[@id="marketInnerContent"]//tr//td[9]')).map(td => td['data-value']);

        expect(quotes.rows.length).toBe(40);
        expect(timestamps.length).toBe(40);

        await scraper.destroyContext(dax);
    }, 60000);

    test('scrap multiple indices', async () => {
        let indices = await scraper.createContext('https://www.investing.com/indices/major-indices');
        let dax = await indices.middleClick('//main//a[normalize-space()="DAX"]');
        let ibex = await indices.middleClick('//main//a[normalize-space()="IBEX 35"]');


        await dax.click('//nav[@data-test="navigation-menu"]//a[normalize-space()="Components"]');
        await ibex.click('//nav[@data-test="navigation-menu"]//a[normalize-space()="Components"]');

        let names = await dax.scrapeMany('//*[@id="marketInnerContent"]//tr//td[2]');
        let lasts = await dax.scrapeMany('//*[@id="marketInnerContent"]//tr//td[3]');
        let volumes = await dax.scrapeMany('//*[@id="marketInnerContent"]//tr//td[8]');
        let times = await dax.scrapeAttributesMany('//*[@id="marketInnerContent"]//tr//td[9]');//, 'data-value');

        expect(names.length).toBe(40);
        expect(lasts.length).toBe(40);
        expect(volumes.length).toBe(40);
        expect(times.length).toBe(40);

        names = await ibex.scrapeMany('//*[@id="marketInnerContent"]//tr//td[2]');
        lasts = await ibex.scrapeMany('//*[@id="marketInnerContent"]//tr//td[3]');
        volumes = await ibex.scrapeMany('//*[@id="marketInnerContent"]//tr//td[8]');
        times = await ibex.scrapeAttributesMany('//*[@id="marketInnerContent"]//tr//td[9]');//, 'data-value');

        expect(names.length).toBe(35);
        expect(lasts.length).toBe(35);
        expect(volumes.length).toBe(35);
        expect(times.length).toBe(35);


        await scraper.destroyContext(dax);
        await scraper.destroyContext(ibex);
        await scraper.destroyContext(indices);
    }, 60000);

});

describe('coolmod.com tests', () => {
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

    test('scrap gpus', async () => {
        let rtx4090s = await scraper.createContext('https://www.coolmod.com/tarjetas-graficas/appliedfilters/10089__9928');

        let outOfStock = await rtx4090s.scrapeMany('//*[@data-price and .//*[normalize-space()="Agotado"]]//*[contains(@class, "productName")]');
        let inOfStock = await rtx4090s.scrapeMany('//*[@data-price and not(.//*[normalize-space()="Agotado"])]//*[contains(@class, "productName")]');

        expect(outOfStock.length).toBeGreaterThan(0);
        expect(inOfStock.length).toBeGreaterThan(0);

        await scraper.destroyContext(rtx4090s);
    }, 60000);
});