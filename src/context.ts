import { Browser, ElementHandle, Page } from 'puppeteer';
import Table, { Cell, Row } from './table';


export default class ScraperContext {
    url(): string {
        return this.page.url();
    }
    browser: Browser;
    page: Page;
    timeout: number;
    constructor(browser: Browser, page: Page, timeout: number = 5000) {
        this.browser = browser;
        this.page = page;
        this.timeout = timeout;
    }

    private async ensureActiveTab() {
        await this.page.bringToFront();
    }

    async goBack(): Promise<void> {
        await this.ensureActiveTab();
        await this.page.goBack();
    }

    async reload(): Promise<void> {
        await this.ensureActiveTab();
        let promises: Promise<any>[] = [];
        promises.push(this.page.waitForNavigation());
        promises.push(this.page.reload());
        await Promise.all(promises);
    }

    async wait(millis: number): Promise<void> {
        await this.contains('/blahblah', millis);
    }

    async contains(xpath: string, timeout: number): Promise<boolean> {
        await this.ensureActiveTab();
        try {
            await this.page.waitForXPath(xpath, { timeout: timeout });
            return true;
        } catch (e) {
            return false;
        }
    }

    async isVisible(xpath: string) {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            let elements: ElementHandle<Node>[] = await this.page.$x(xpath);
            let visible = await this.filterDisplayed(elements);
            return visible.length === elements.length;
        } else {
            return false;
        }
    }

    async getInputValue(xpath: string): Promise<string> {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            const [element] = await this.page.$x(xpath);
            return await this.page.evaluate(el => (el as HTMLInputElement).value, element);
        } else {
            throw new Error(`Cannot get value for ${xpath}.`);
        }
    }

    async selectByValue(values: string[], xpath: string) {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            const [element]: ElementHandle<Node>[] = await this.page.$x(xpath);
            await (element as ElementHandle<HTMLElement>).select(...values);
        } else {
            throw new Error(`Cannot select for ${xpath}.`);
        }
    }

    async selectByLabel(labels: string[], xpath: string) {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            const [element]: ElementHandle<Node>[] = await this.page.$x(xpath);
            let valuePromises: Promise<any>[] = [];
            for (let label of labels) {
                valuePromises.push(
                    this.page.$x(xpath + `//option[text()="${label}"]`)
                );
            }
            let values: string[] = await Promise.all(valuePromises);
            await (element as ElementHandle<HTMLElement>).select(...values);
        } else {
            throw new Error(`Cannot select for ${xpath}.`);
        }
    }

    async getSelectedLabels(xpath: string): Promise<string[]> {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            const [element] = await this.page.$x(xpath);
            let labels = await this.page.evaluate(el => {
                let labels: string[] = [];
                for (let i = 0; i < (el as HTMLSelectElement).selectedOptions.length; i++) {
                    labels.push((el as HTMLSelectElement).selectedOptions[i].label);
                }
                return labels;
            }, element);
            return labels;
        } else {
            throw new Error(`Cannot get selected labels for ${xpath}.`);
        }
    }

    async getSelectedValues(xpath: string): Promise<string[]> {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            const [element] = await this.page.$x(xpath);
            let values = await this.page.evaluate(el => {
                let values: string[] = [];
                for (let i = 0; i < (el as HTMLSelectElement).selectedOptions.length; i++) {
                    values.push((el as HTMLSelectElement).selectedOptions[i].value);
                }
                return values;
            }, element);
            return values;
        } else {
            throw new Error(`Cannot get selected values for ${xpath}.`);
        }
    }

    async type(text: string, xpath: string) {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            const [element]: ElementHandle<Node>[] = await this.page.$x(xpath);
            await (element as ElementHandle<HTMLElement>).click({ clickCount: 3 });
            await (element as ElementHandle<HTMLElement>).press('Backspace');
            await element.type(text, { delay: 100 });
        } else {
            throw new Error(`Cannot type in ${xpath}.`);
        }
    }

    async middleClick(xpath: string): Promise<ScraperContext> {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            let elements: ElementHandle<Node>[] = await this.page.$x(xpath);
            elements = await this.filterDisplayed(elements);

            let clickable: ElementHandle<HTMLElement> | undefined = undefined;

            if (elements.length > 1) {
                throw new Error(`Multiple visible elements found for ${xpath}. Refine xpath.`);
            }

            if (elements.length == - 0) {
                throw new Error(`No visible element found for ${xpath}. Refine xpath.`);
            }

            clickable = elements[0] as ElementHandle<HTMLElement>;

            let pages = await this.browser.pages();

            const newTargetPromise = this.browser.waitForTarget(async target => {
                if (target.type() !== 'page') return false;
                let page = await target.page();
                if (!page) return false;
                let result = pages.includes(page);
                return !result;
            });

            await clickable.click({ button: 'middle' });

            let promises: Promise<any>[] = [
                newTargetPromise,
            ];

            let [newTarget] = await Promise.all(promises);
            let newPage = await newTarget.page();
            await newPage.bringToFront();
            return new ScraperContext(this.browser, newPage, this.timeout);
        } else {
            throw new Error(`Cannot perform middle click for ${xpath}.`);
        }
    }

    async scrollIntoView(xpath: string){
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            let elements: ElementHandle<Node>[] = await this.page.$x(xpath);
            if (elements.length > 1) {
                throw new Error(`Multiple elements found for ${xpath}. Refine xpath.`);
            }

            if (elements.length === 0) {
                throw new Error(`No element found for ${xpath}. Refine xpath.`);
            }

            await this.page.evaluate(el => {
                (el as HTMLElement).scrollIntoView();
            }, elements[0]);
        } else {
            throw new Error(`Cannot scroll element into view for ${xpath}.`);
        }
    }

    async click(xpath: string, options?: { expectNavigation?: boolean, includeInvisible?: boolean }) {
        await this.ensureActiveTab();
        if (await this.contains(xpath, this.timeout)) {
            let elements: ElementHandle<Node>[] = await this.page.$x(xpath);

            if(!options?.includeInvisible === true){
                elements = await this.filterDisplayed(elements);
            }

            let clickable: ElementHandle<HTMLElement> | undefined = undefined;

            if (elements.length > 1) {
                throw new Error(`Multiple visible elements found for ${xpath}. Refine xpath.`);
            }

            if (elements.length === 0) {
                throw new Error(`No visible element found for ${xpath}. Refine xpath.`);
            }

            clickable = elements[0] as ElementHandle<HTMLElement>;

            let promises: Promise<any>[] = [];

            if (options?.expectNavigation !== false) {
                promises.push(this.page.waitForNavigation({ timeout: this.timeout }));
            }
            promises.push(clickable.click({ delay: 100 }));


            await Promise.all(promises);
        } else {
            throw new Error(`Cannot perform click for ${xpath}.`);
        }
    }

    async clickIfExists(xpath: string, options?: { expectNavigation?: boolean, includeInvisible?: boolean }): Promise<boolean> {
        await this.ensureActiveTab();
        try {
            await this.click(xpath, options);
            return true;
        } catch (error) {
            return false;
        }
    }

    private async filterDisplayed(elements: ElementHandle<Node>[]): Promise<ElementHandle<Node>[]> {
        await this.ensureActiveTab();
        let flagPromises: Promise<boolean>[] = [];

        for (let element of elements) {
            flagPromises.push(
                this.page.evaluate(el => {
                    let rect = (el as HTMLElement).getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                }, element)
            );
        }

        let flags = await Promise.all(flagPromises);

        let displayed: ElementHandle<Node>[] = [];

        for (let i = 0; i < elements.length; i++) {
            if (flags[i]) {
                displayed.push(elements[i]);
            }
        }

        return displayed;
    }

    async scrapeTable(xpath: string, options?: { headers?: (string | null)[], dataContainsHeaders?: boolean, ignoreHeaderRow?: boolean }): Promise<Table> {
        await this.ensureActiveTab();

        await this.page.waitForXPath(xpath, { timeout: this.timeout });
        let table = new Table();

        let headerRows: ElementHandle<Node>[] | null;
        if (await this.contains(`${xpath}//tr[th]`, 1000)) {
            headerRows = await this.page.$x(`${xpath}//tr[th]`);
        } else {
            headerRows = null;
        }
        let dataRows = await this.page.$x(`${xpath}//tr[td]`);

        let ignoreHeaderRow = options?.ignoreHeaderRow || false;

        let headers: (string | null)[] = [];

        if (!ignoreHeaderRow && headerRows) {
            headers = await this.scrapeMany(`${xpath}//th`);
        }

        let firstRowIndex = 0;
        if (options?.dataContainsHeaders) {
            firstRowIndex = 1;
            headers = await this.scrapeMany(`${xpath}//tr[td][1]//td`);
        }

        if (options?.headers) {
            headers = options?.headers;
        }

        let dataRow = await this.scrapeMany(`${xpath}//tr[td][1]//td`);
        if (dataRow.length !== headers.length) {
            throw new Error('Unmatched number of headers. Hint: use the "options.headers" parameter to explitly declare proper headers.');
        }

        let data = await this.scrapeMany(`${xpath}//td`);

        for (let j = 0; j < headers.length; j++) {
            let header = headers[j];
            if (header) {
                table.headers.push(header);
            }
        }

        for (let i = firstRowIndex; i < dataRows.length; i++) {
            let row = new Row();
            for (let j = 0; j < headers.length; j++) {
                let header = headers[j];
                if (header) {
                    row.cells[header] = new Cell(data[i * headers.length + j]);
                }
            }
            table.rows.push(row);
        }

        return table;
    }

    async scrapeOne(xpath: string, options?: { includeInvisible?: boolean }): Promise<string> {
        await this.ensureActiveTab();
        let result = await this.scrapeMany(xpath, options);
        if (result.length === 0) {
            throw new Error(`No element found for xpath=${xpath}`);
        }
        return result[0];
    }

    async scrapeAttributesOne(xpath: string, options?: { includeInvisible?: boolean }): Promise<Record<string, string | null>> {
        await this.ensureActiveTab();
        let result = await this.scrapeAttributesMany(xpath, options);
        if (result.length === 0) {
            throw new Error(`No element found for xpath=${xpath}`);
        }
        return result[0];
    }

    async scrapeAttributesMany(xpath: string, options?: { includeInvisible?: boolean }): Promise<Record<string, string | null>[]> {
        await this.ensureActiveTab();
        await this.page.waitForXPath(xpath, { timeout: this.timeout });
        let elements = await this.page.$x(xpath);
        if(!options?.includeInvisible === true){
            elements = await this.filterDisplayed(elements);
        }
        const promises = [];
        let labels: Record<string, string | null>[] = [];

        for (const element of elements) {
            promises.push(this.page.evaluate(el => {
                let dict: Record<string, string | null> = {};
                let element: HTMLElement = (el as HTMLElement);
                let names: string[] = element.getAttributeNames();
                for (let name of names) {
                    dict[name] = element.getAttribute(name);
                }
                return dict;
            }, element));
        }

        await Promise.all(promises).then((results) => labels = results);
        return labels;
    }

    async scrapeMany(xpath: string, options?: { includeInvisible?: boolean }): Promise<string[]> {
        await this.ensureActiveTab();
        await this.page.waitForXPath(xpath, { timeout: this.timeout });
        let elements = await this.page.$x(xpath);

        if(!options?.includeInvisible === true){
            elements = await this.filterDisplayed(elements);
        }

        const promises = [];
        let labels: string[] = [];

        for (const element of elements) {
            promises.push(this.page.evaluate(el => (el as HTMLElement).innerText, element));
        }

        await Promise.all(promises).then((results) => labels = results);
        return labels;
    }
}
