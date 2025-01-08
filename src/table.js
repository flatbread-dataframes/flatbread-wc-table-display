import { TableBuilderFactory } from "./builders/factory.js"

export class DataTable extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
    }

    update(data, options) {
        const builder = TableBuilderFactory.create(options.type, data, options)

        this.shadowRoot.innerHTML = `
            ${builder.getStyleSheet()}
            ${builder.buildTable()}
        `
    }
}

customElements.define("data-table", DataTable)
