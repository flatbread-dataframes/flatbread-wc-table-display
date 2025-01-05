import { Data } from "./data.js"
import { HTMLBuilder } from "./builder.js"

export class DataViewer extends HTMLElement {
    static get observedAttributes() {
        return [
            "src", "locale", "na-rep",
            "hide-group-borders", "hide-row-borders",
            "hide-thead-border", "hide-index-border",
            "show-hover", "margin-labels",
            "collapse-columns"
        ]
    }

    static get defaults() {
        return {
            locale: "default",
            naRep: "-",
            buffer: 30,
            marginLabels: [],
            styling: {
                collapseColumns: false,
                hoverEffect: false,
                theadBorder: true,
                indexBorder: true,
                groupBorders: true,
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
        this._htmlBuilder = new HTMLBuilder(this.data, this.options)
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
            case "locale":
                this.options.locale = newValue ?? DataViewer.defaults.locale
                this.render()
                break
            case "na-rep":
                this.options.naRep = newValue ?? DataViewer.defaults.naRep
                this.render()
                break
            case "hide-group-borders":
                this.options.styling.groupBorders = newValue === null
                this.render()
                break
            case "hide-row-borders":
                this.options.styling.rowBorders = newValue === null
                this.render()
                break
            case "hide-index-border":
                this.options.styling.indexBorder = newValue === null
                this.render()
                break
            case "hide-thead-border":
                this.options.styling.theadBorder = newValue === null
                this.render()
                break
            case "show-hover":
                this.options.styling.hoverEffect = newValue !== null
                this.render()
                break
            case "margin-labels":
                const labels = newValue.split(";")
                this.options.marginLabels = labels
                this.render()
                break
            case "collapse-columns":
                this.options.styling.collapseColumns = newValue !== null
                this.render()
                break
        }
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
        const htmlBuilder = new HTMLBuilder(this.data, this.options)
        this.shadowRoot.innerHTML = `
            ${htmlBuilder.getStyleSheet()}
            ${htmlBuilder.buildTable()}
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
