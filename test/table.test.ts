import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import Scraper from '../src/scraper'
import * as dotenv from 'dotenv'

describe('table tests', () => {
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

    test('scrap table with headers', async () => {
        let html = `
        <html>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th>h1</th>
                            <th>h2</th>
                            <th>h3</th>
                            <th>h4</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>a1</td>
                            <td>b1</td>
                            <td>c1</td>
                            <td>d1</td>
                        </tr>
                        <tr>
                            <td>a2</td>
                            <td>b2</td>
                            <td>c2</td>
                            <td>d2</td>
                        </tr>
                        <tr>
                            <td>a3</td>
                            <td>b3</td>
                            <td>c3</td>
                            <td>d3</td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);
        let table = await context.scrapeTable('//table');

        expect(table.rows.length).toBe(3);
        expect(table.headers).toStrictEqual(['h1', 'h2', 'h3', 'h4']);
        expect(table.rows[1].cells['h3'].text).toBe('c2');
        await scraper.destroyContext(context);
    }, 30000);

    test('scrap table with explicit headers', async () => {
        let html = `
        <html>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th>h1</th>
                            <th>h2</th>
                            <th>h3</th>
                            <th>h4</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>a1</td>
                            <td>b1</td>
                            <td>c1</td>
                            <td>d1</td>
                        </tr>
                        <tr>
                            <td>a2</td>
                            <td>b2</td>
                            <td>c2</td>
                            <td>d2</td>
                        </tr>
                        <tr>
                            <td>a3</td>
                            <td>b3</td>
                            <td>c3</td>
                            <td>d3</td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);
        let table = await context.scrapeTable('//table', { headers: [null, null, 'h1', 'h2'] });
        expect(table.rows.length).toBe(3);
        expect(table.headers).toStrictEqual(['h1', 'h2']);
        expect(table.rows[1].cells['h2'].text).toBe('d2');
        await scraper.destroyContext(context);
    }, 30000);

    test('scrap table with headers in first row', async () => {
        let html = `
        <html>
            <body>
                <table>
                    <tbody>
                        <tr>
                            <td>h1</td>
                            <td>h2</td>
                            <td>h3</td>
                            <td>h4</td>
                        </tr>
                        <tr>
                            <td>a1</td>
                            <td>b1</td>
                            <td>c1</td>
                            <td>d1</td>
                        </tr>
                        <tr>
                            <td>a2</td>
                            <td>b2</td>
                            <td>c2</td>
                            <td>d2</td>
                        </tr>
                        <tr>
                            <td>a3</td>
                            <td>b3</td>
                            <td>c3</td>
                            <td>d3</td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);
        let table = await context.scrapeTable('//table', { dataContainsHeaders: true });
        expect(table.rows.length).toBe(3);
        expect(table.headers).toStrictEqual(['h1', 'h2', 'h3', 'h4']);
        expect(table.rows[1].cells['h3'].text).toBe('c2');
        await scraper.destroyContext(context);
    }, 30000);


    test('scrap table with unmatched headers', async () => {
        let html = `
        <html>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th>h1</th>
                            <th>h2</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>a1</td>
                            <td>b1</td>
                            <td>c1</td>
                            <td>d1</td>
                        </tr>
                        <tr>
                            <td>a2</td>
                            <td>b2</td>
                            <td>c2</td>
                            <td>d2</td>
                        </tr>
                        <tr>
                            <td>a3</td>
                            <td>b3</td>
                            <td>c3</td>
                            <td>d3</td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>`;

        let context = await scraper.createContext(`data:text/html,${html}`);

        await expect(context.scrapeTable('//table'))
            .rejects
            .toThrowError();
        await scraper.destroyContext(context);
    }, 30000);
});

