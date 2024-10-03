import { Data } from "./data.js"
import { HTMLBuilder } from "./builder.js"


export class SimpleTable extends HTMLElement {
    static get observedAttributes() {
        return ["src", "locale", "na-rep"]
    }

    static get defaults() {
        return {
            locale: "default",
            naRep: "-"
        }
    }

    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.options = { ...SimpleTable.defaults }
    }

    connectedCallback() {
        this.render()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return
        switch (name) {
            case "src":
                this.loadDataFromSrc(newValue)
                break
            case "locale":
                this.options.locale = newValue || SimpleTable.defaults.locale
                this.render()
                break
            case "na-rep":
                this.options.naRep = newValue || SimpleTable.defaults.naRep
                this.render()
                break
        }
    }

    async loadDataFromSrc(src) {
        try {
            const response = await fetch(src)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const rawData = await response.json()
            this.setData(rawData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
            this.showErrorMessage("Failed to load data")
        }
    }

    setData(rawData) {
        if (!rawData) {
            this.showErrorMessage("No data provided")
            return
        }
        this._data = new Data(rawData)
        this.render()
    }

    render() {
        if (!this._data) {
            this.shadowRoot.innerHTML = this.getStyleSheet()
            return
        }

        const htmlBuilder = new HTMLBuilder(this._data, this.options)
        this.shadowRoot.innerHTML = `
            ${this.getStyleSheet()}
            ${htmlBuilder.buildTable()}
        `
    }

    getStyleSheet() {
        return `
            <style>
                table { border-collapse: collapse; }
                tbody tr {
                    &:has(th[rowspan]) { border-top: 1px solid var(--border-color, black); }
                    &:first-of-type:has(th) { border-top: 3px solid var(--border-color, black); }
                }
                tbody tr:hover :where(td, th:not([rowspan])) { background-color: #faf9f9; }
                tbody th { text-align: left; }
                td { text-align: right; }
                th, td { padding: .25em .5em; }
            </style>
        `
    }

    showErrorMessage(message) {
        this.shadowRoot.innerHTML = `
            ${this.getStyleSheet()}
            <p style="color: red;">${message}</p>
        `
    }

    // Getter and setter for direct data loading
    get data() {
        return this._data
    }

    set data(value) {
        this.setData(value)
    }
}

window.customElements.define('simple-table', SimpleTable)
