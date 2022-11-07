export default class Table {
    headers: string[] = [];
    rows: Row[] = [];

    constructor() {
    }
}

export class Row {
    cells: Record<string, Cell> = {}
}

export class Cell {
    text: string;
    fields: Record<string, string> = {}

    constructor(text: string) {
        this.text = text;
    }
}