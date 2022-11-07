import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import Scraper from '../src/scraper'
import * as dotenv from 'dotenv'
import ScraperContext from '../src/context';

describe('failure scraper tests', () => {
    beforeAll(async () => {
        dotenv.config()
    });


    test('fails if no chrome host located', async () => {
        let scraper = new Scraper({ chromeHost: 'no-host' });
        await expect(scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/'))
            .rejects
            .toThrowError();
    }, 30000);

});


describe('scraper tests', () => {
    let scraper: Scraper;
    beforeAll(async () => {
        dotenv.config()
        scraper = new Scraper({ chromeHost: process.env.CHROME_HOST || 'localhost', chromePort: 9222, timeout: 2000 });
        return;
    });

    afterAll(async () => {
        await scraper.close();
        return;
    });

    test('creates context', async () => {
        let context = await scraper.createContext('https://getbootstrap.com/docs/4.0/components/forms/');
        expect(context).not.toBeNull();
        await scraper.destroyContext(context);
    }, 30000);

});

