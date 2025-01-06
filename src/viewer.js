import { Data } from "./data.js"
import { TableBuilderFactory } from "./builders/factory.js"

export class DataViewer extends HTMLElement {
    static get observedAttributes() {
        return [
            "src", "type", "locale", "na-rep",
            "hide-column-borders", "hide-row-borders",
            "hide-thead-border", "hide-index-border",
            "show-hover", "margin-labels",
            "collapse-columns", "section-levels",
        ]
    }

    static get defaults() {
        return {
            locale: "default",
            naRep: "-",
            buffer: 30,
            marginLabels: [],
            type: "default",
            styling: {
                sectionLevels: 0,
                collapseColumns: false,
                hoverEffect: false,
                theadBorder: true,
                indexBorder: true,
                columnBorders: true,
                rowBorders: true,
                marginBorders: true,
            }
        }
    }

    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.options = { ...DataViewer.defaults }
        this.handleDataChange = this.handleDataChange.bind(this)
        this.handleTableClick = this.handleTableClick.bind(this)

        this._data = new Data()
    }

    // MARK: setup
    connectedCallback() {
        this.data.addEventListener("data-changed", this.handleDataChange)
        this.render()
        this.addEventListeners()
    }

    disconnectedCallback() {
        this.data.removeEventListener("data-changed", this.handleDataChange)
        this.removeEventListeners()
    }

    addEventListeners() {
        this.shadowRoot.addEventListener("click", this.handleTableClick)
    }

    removeEventListeners() {
        this.shadowRoot.removeEventListener("click", this.handleTableClick)
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return
        switch (name) {
            case "src":
                this.loadDataFromSrc(newValue)
                break
            case "type":
                this.options.type = newValue ?? DataViewer.defaults.type
                this.render()
                break
            case "locale":
                this.options.locale = newValue ?? DataViewer.defaults.locale
                this.render()
                break
            case "na-rep":
                this.options.naRep = newValue ?? DataViewer.defaults.naRep
                this.render()
                break
            case "hide-column-borders":
                this.options.styling.columnBorders = !this.getBooleanAttribute(newValue)
                this.render()
                break
            case "hide-row-borders":
                this.options.styling.rowBorders = !this.getBooleanAttribute(newValue)
                this.render()
                break
            case "hide-index-border":
                this.options.styling.indexBorder = !this.getBooleanAttribute(newValue)
                this.render()
                break
            case "hide-thead-border":
                this.options.styling.theadBorder = !this.getBooleanAttribute(newValue)
                this.render()
                break
            case "show-hover":
                this.options.styling.hoverEffect = this.getBooleanAttribute(newValue)
                this.render()
                break
            case "collapse-columns":
                this.options.styling.collapseColumns = this.getBooleanAttribute(newValue)
                this.render()
                break
            case "margin-labels":
                const labels = newValue.split(";")
                this.options.marginLabels = labels
                this.render()
                break
            case "section-levels":
                const level = Math.max(0, parseInt(newValue) ?? DataViewer.defaults.styling.sectionLevels)
                this.options.styling.sectionLevels = level
                this.render()
                break
        }
    }

    getBooleanAttribute(value) {
        // Return false if attribute is not present
        if (value === null) return false
        // Return true if attribute is present without value
        if (value === "") return true
        // Return boolean based on string value
        return value.toLowerCase() === "true"
    }

    async loadDataFromSrc(src) {
        try {
            const response = await fetch(src)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const rawData = await response.json()
            this.data = rawData
        } catch (error) {
            console.error("Failed to fetch data:", error)
            this.showErrorMessage("Failed to load data")
        }
    }

    // MARK: getter/setter
    get data() {
        return this._data
    }

    set data(value) {
        this._data.setData(value)
    }

    // MARK: render
    render() {
        if (!this.data) return
        const builder = TableBuilderFactory.create(this.options.type, this.data, this.options)
        this.shadowRoot.innerHTML = `
            ${builder.getStyleSheet()}
            ${builder.buildTable()}
        `
    }

    // MARK: handlers
    handleDataChange() {
        this.render()
        this.dispatchEvent(new CustomEvent("data-changed", { detail: this.data }))
    }

    handleTableClick(event) {
        const cell = event.target.closest("th, td")
        if (!cell) return

        const tr = cell.closest("tr")
        const isInHead = tr.closest("thead") !== null
        const isInBody = tr.closest("tbody") !== null

        let source, row, col

        if (isInHead) {
            source = "column"
            row = Array.from(tr.parentNode.children).indexOf(tr)
            col = Array.from(tr.children).indexOf(cell)
        } else if (isInBody) {
            if (cell.tagName === "TH") {
                source = "index"
                row = Array.from(tr.parentNode.children).indexOf(tr)
                col = Array.from(tr.children).filter(c => c.tagName === "TH").indexOf(cell)
            } else {
                source = "values"
                row = Array.from(tr.parentNode.children).indexOf(tr)
                col = Array.from(tr.children).filter(c => c.tagName === "TD").indexOf(cell)
            }
        } else {
            return // Not in thead or tbody, ignore
        }

        const value = cell.textContent

        this.dispatchEvent(new CustomEvent("cell-click", {
            detail: { value, source, row, col },
            bubbles: true,
            composed: true
        }))
    }

    showErrorMessage(message) {
        this.shadowRoot.innerHTML = `
            ${this.getStyleSheet()}
            <p style="color: red;">${message}</p>
        `
    }
}

window.customElements.define('data-viewer', DataViewer)
